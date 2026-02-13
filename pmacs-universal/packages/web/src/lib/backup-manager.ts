/**
 * Automated Backup Manager for CSV Database
 * Handles scheduled backups and retention policies
 */

import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './logger';

interface BackupConfig {
  sourceDataPath: string;
  backupPath: string;
  intervalHours: number;
  retentionDays: number;
  enabled: boolean;
}

class BackupManager {
  private config: BackupConfig;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.config = {
      sourceDataPath: process.env.DATA_PATH || path.join(process.cwd(), '../api/data'),
      backupPath: process.env.BACKUP_PATH || path.join(process.cwd(), '../backups'),
      intervalHours: parseInt(process.env.BACKUP_INTERVAL_HOURS || '6', 10),
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
      enabled: process.env.ENABLE_AUTO_BACKUP === 'true',
    };
  }

  /**
   * Start automated backup scheduler
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      logger.info('Automated backups are disabled');
      return;
    }

    logger.info('Starting automated backup manager', {
      intervalHours: this.config.intervalHours,
      retentionDays: this.config.retentionDays,
    });

    // Ensure backup directory exists
    try {
      await fs.mkdir(this.config.backupPath, { recursive: true });
    } catch (error) {
      logger.error('Failed to create backup directory', error as Error);
      return;
    }

    // Perform initial backup
    await this.performBackup();

    // Schedule periodic backups
    const intervalMs = this.config.intervalHours * 60 * 60 * 1000;
    this.intervalId = setInterval(async () => {
      await this.performBackup();
      await this.cleanOldBackups();
    }, intervalMs);

    logger.info(`Backup scheduler started. Next backup in ${this.config.intervalHours} hours`);
  }

  /**
   * Stop automated backup scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Backup scheduler stopped');
    }
  }

  /**
   * Perform a backup of all CSV files
   */
  async performBackup(): Promise<void> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.config.backupPath, `backup_${timestamp}`);

    try {
      logger.info('Starting database backup', { backupDir });

      // Create backup directory
      await fs.mkdir(backupDir, { recursive: true });

      // List of CSV files to backup
      const filesToBackup = [
        'inventory_master.csv',
        'transaction_logs.csv',
        'user_access.csv',
        'access_logs.csv',
      ];

      let backedUpFiles = 0;

      // Copy each file
      for (const filename of filesToBackup) {
        const sourcePath = path.join(this.config.sourceDataPath, filename);
        const destPath = path.join(backupDir, filename);

        try {
          await fs.copyFile(sourcePath, destPath);
          backedUpFiles++;
        } catch (error) {
          logger.warn(`Failed to backup file: ${filename}`, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Create backup metadata
      const metadata = {
        timestamp: new Date().toISOString(),
        filesBackedUp: backedUpFiles,
        totalFiles: filesToBackup.length,
        backupPath: backupDir,
      };

      await fs.writeFile(
        path.join(backupDir, 'backup_metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      const duration = Date.now() - startTime;
      logger.info('Database backup completed successfully', {
        duration,
        filesBackedUp: backedUpFiles,
        backupDir,
      });
    } catch (error) {
      logger.error('Backup failed', error as Error, {
        backupDir,
        duration: Date.now() - startTime,
      });
    }
  }

  /**
   * Clean up backups older than retention period
   */
  async cleanOldBackups(): Promise<void> {
    try {
      const backups = await fs.readdir(this.config.backupPath);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      let deletedCount = 0;

      for (const backup of backups) {
        if (!backup.startsWith('backup_')) continue;

        const backupPath = path.join(this.config.backupPath, backup);
        const stats = await fs.stat(backupPath);

        if (stats.isDirectory() && stats.mtime < cutoffDate) {
          await fs.rm(backupPath, { recursive: true, force: true });
          deletedCount++;
          logger.info(`Deleted old backup: ${backup}`, {
            age: Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)),
          });
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} old backup(s)`);
      }
    } catch (error) {
      logger.error('Failed to clean old backups', error as Error);
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<Array<{ name: string; date: Date; size: number }>> {
    try {
      const backups = await fs.readdir(this.config.backupPath);
      const backupList = [];

      for (const backup of backups) {
        if (!backup.startsWith('backup_')) continue;

        const backupPath = path.join(this.config.backupPath, backup);
        const stats = await fs.stat(backupPath);

        if (stats.isDirectory()) {
          backupList.push({
            name: backup,
            date: stats.mtime,
            size: 0, // Would need to recursively calculate
          });
        }
      }

      return backupList.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      logger.error('Failed to list backups', error as Error);
      return [];
    }
  }

  /**
   * Restore from a specific backup
   */
  async restoreBackup(backupName: string): Promise<void> {
    const startTime = Date.now();
    const backupDir = path.join(this.config.backupPath, backupName);

    try {
      logger.warn('Starting database restore', { backupName });

      // Verify backup exists
      await fs.access(backupDir);

      // Read metadata
      const metadataPath = path.join(backupDir, 'backup_metadata.json');
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

      logger.info('Restore metadata', metadata);

      // Restore each file
      const files = await fs.readdir(backupDir);
      let restoredFiles = 0;

      for (const filename of files) {
        if (filename === 'backup_metadata.json') continue;
        if (!filename.endsWith('.csv')) continue;

        const sourcePath = path.join(backupDir, filename);
        const destPath = path.join(this.config.sourceDataPath, filename);

        await fs.copyFile(sourcePath, destPath);
        restoredFiles++;
      }

      const duration = Date.now() - startTime;
      logger.info('Database restore completed successfully', {
        duration,
        restoredFiles,
        backupName,
      });
    } catch (error) {
      logger.error('Restore failed', error as Error, {
        backupName,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Manually trigger a backup
   */
  async manualBackup(): Promise<void> {
    logger.info('Manual backup triggered');
    await this.performBackup();
  }
}

// Export singleton instance
export const backupManager = new BackupManager();

// Auto-start in production
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_AUTO_BACKUP === 'true') {
  backupManager.start().catch((error) => {
    logger.error('Failed to start backup manager', error);
  });
}
