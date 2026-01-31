import { eq, inArray } from 'drizzle-orm';
import type { AppDatabase } from '../db';
import {
  files,
  fileVersions,
  folders,
  pipelines,
  pipelineRuns,
  pipelineRunSteps,
  pipelineRunExpectedEvents,
  dataRooms,
} from '../db/schema';

/**
 * Service for cascading deletions across related entities.
 * Handles the proper order of deletions to maintain referential integrity.
 */
export class CascadeDeletionService {
  constructor(private db: AppDatabase) {}

  /**
   * Delete pipeline run data (steps and expected events) for given run IDs
   */
  deletePipelineRunData(runIds: string[]): void {
    if (runIds.length === 0) return;
    this.db.delete(pipelineRunExpectedEvents).where(inArray(pipelineRunExpectedEvents.pipelineRunId, runIds)).run();
    this.db.delete(pipelineRunSteps).where(inArray(pipelineRunSteps.pipelineRunId, runIds)).run();
  }

  /**
   * Delete pipeline runs and their associated data for given file version IDs
   */
  deletePipelineRunsForVersions(versionIds: string[]): void {
    if (versionIds.length === 0) return;

    const runs = this.db.select().from(pipelineRuns).where(inArray(pipelineRuns.fileVersionId, versionIds)).all();
    const runIds = runs.map((r) => r.id);

    this.deletePipelineRunData(runIds);
    this.db.delete(pipelineRuns).where(inArray(pipelineRuns.fileVersionId, versionIds)).run();
  }

  /**
   * Delete file versions and their associated pipeline runs for given file IDs
   */
  deleteFileVersionsForFiles(fileIds: string[]): void {
    if (fileIds.length === 0) return;

    const versions = this.db.select().from(fileVersions).where(inArray(fileVersions.fileId, fileIds)).all();
    const versionIds = versions.map((v) => v.id);

    this.deletePipelineRunsForVersions(versionIds);
    this.db.delete(fileVersions).where(inArray(fileVersions.fileId, fileIds)).run();
  }

  /**
   * Delete a file and all its versions, pipeline runs, steps, and expected events
   */
  deleteFile(fileId: string): void {
    this.deleteFileVersionsForFiles([fileId]);
    this.db.delete(files).where(eq(files.id, fileId)).run();
  }

  /**
   * Recursively collect all descendant folder IDs starting from a root folder
   */
  collectFolderIds(folderId: string): string[] {
    const result: string[] = [folderId];
    const children = this.db.select().from(folders).where(eq(folders.parentId, folderId)).all();
    for (const child of children) {
      result.push(...this.collectFolderIds(child.id));
    }
    return result;
  }

  /**
   * Delete a folder and all its contents (subfolders, files, versions, pipeline runs)
   */
  deleteFolder(folderId: string): void {
    const folderIds = this.collectFolderIds(folderId);

    // Get all files in these folders
    const folderFiles = this.db.select().from(files).where(inArray(files.folderId, folderIds)).all();
    const fileIds = folderFiles.map((f) => f.id);

    // Delete all file-related data
    this.deleteFileVersionsForFiles(fileIds);

    // Delete files
    if (fileIds.length > 0) {
      this.db.delete(files).where(inArray(files.folderId, folderIds)).run();
    }

    // Delete all folders
    this.db.delete(folders).where(inArray(folders.id, folderIds)).run();
  }

  /**
   * Delete a data room and all its contents (folders, files, pipelines, runs)
   */
  deleteDataRoom(dataRoomId: string): void {
    // Get all files in this data room
    const roomFiles = this.db.select().from(files).where(eq(files.dataRoomId, dataRoomId)).all();
    const fileIds = roomFiles.map((f) => f.id);

    // Delete all file-related data
    this.deleteFileVersionsForFiles(fileIds);

    // Delete files
    if (fileIds.length > 0) {
      this.db.delete(files).where(eq(files.dataRoomId, dataRoomId)).run();
    }

    // Delete folders
    this.db.delete(folders).where(eq(folders.dataRoomId, dataRoomId)).run();

    // Delete pipelines
    this.db.delete(pipelines).where(eq(pipelines.dataRoomId, dataRoomId)).run();

    // Delete data room
    this.db.delete(dataRooms).where(eq(dataRooms.id, dataRoomId)).run();
  }
}
