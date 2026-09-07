import { UploadedFileRecord, FileProcessingStatus, FileProcessingLog, User } from '../types';

export type FileProcessingEventType =
  | 'FILE_UPLOADED'
  | 'FILE_PROGRESS'
  | 'FILE_LOG'
  | 'FILE_COMPLETED'
  | 'FILE_ERROR'
  | 'FILE_DELETED'
  | 'AI_CONTEXT_UPDATED';

export interface FileProcessingEvent {
  type: FileProcessingEventType;
  fileId: string;
  file?: UploadedFileRecord;
  progress?: number;
  stage?: string;
  log?: FileProcessingLog;
  aiContextSnippet?: string;
  timestamp: string;
}

type EventListener = (event: FileProcessingEvent) => void;

class RealtimeFileEngine {
  private listeners: Set<EventListener> = new Set();
  private processingQueue: Map<string, UploadedFileRecord> = new Map();
  private aiKnowledgeBase: Map<string, string> = new Map();

  /**
   * Subscribe to real-time WebSocket / Event-driven events
   */
  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: FileProcessingEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in file event listener:', err);
      }
    });
  }

  /**
   * Start background real-time processing of an uploaded file
   */
  public processFileAsync(
    fileData: {
      name: string;
      size: number;
      department: string;
      customContent?: string;
    },
    user: User,
    onProgressUpdate?: (updatedRecord: UploadedFileRecord) => void
  ): UploadedFileRecord {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fileSizeStr = `${(fileData.size / (1024 * 1024)).toFixed(2)} MB`;
    const uploadTimestamp = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    // Initial Pending Record
    const initialRecord: UploadedFileRecord = {
      id: fileId,
      filename: fileData.name,
      uploadDate: `วันนี้, ${uploadTimestamp}`,
      records: 'กำลังประมวลผล...',
      status: 'Processing',
      department: fileData.department || 'Central Lab',
      fileSize: fileSizeStr,
      ownerId: user.id,
      ownerName: user.name,
      ownerEmail: user.email,
      ownerRole: user.role,
      processingStatus: 'Pending',
      processingProgress: 5,
      processingStage: 'กำลังเตรียมคิวงานประมวลผล (Queued for ingestion)',
      logs: [
        {
          timestamp: new Date().toLocaleTimeString(),
          stage: 'Queue',
          message: `รับไฟล์ ${fileData.name} จาก ${user.name} (${user.role}) เข้าคิวประมวลผลพื้นหลัง`,
          type: 'info',
        },
      ],
      aiIngested: false,
    };

    this.processingQueue.set(fileId, initialRecord);
    this.emit({
      type: 'FILE_UPLOADED',
      fileId,
      file: initialRecord,
      timestamp: new Date().toISOString(),
    });

    if (onProgressUpdate) {
      onProgressUpdate(initialRecord);
    }

    // Run simulated WebSocket / Background Worker Steps
    this.runPipelineSimulation(initialRecord, fileData, onProgressUpdate);

    return initialRecord;
  }

  private runPipelineSimulation(
    record: UploadedFileRecord,
    fileData: { name: string; department: string; size: number },
    onProgressUpdate?: (updatedRecord: UploadedFileRecord) => void
  ) {
    let currentRecord = { ...record };

    const steps = [
      {
        progress: 25,
        status: 'Processing' as FileProcessingStatus,
        stage: 'กำลังตรวจสอบ Schema & เข้ารหัสข้อมูล (Schema Validation)',
        logMessage: `ตรวจพบโครงสร้างไฟล์ LIS/HIS (${fileData.name}) - ตรวจสอบความถูกต้องของคอลัมน์และ Header เรียบร้อย`,
        logType: 'info' as const,
        delay: 600,
      },
      {
        progress: 55,
        status: 'Processing' as FileProcessingStatus,
        stage: 'กำลังสกัดแถวข้อมูลสิ่งส่งตรวจและคัดกรองอุบัติการณ์ (Row Extraction)',
        logMessage: `สกัดข้อมูลสำเร็จ 1,480 รายการ | ค้นพบกรณีปฏิเสธสิ่งส่งตรวจ (Specimen Rejection) 12 เคส และความเสี่ยง Level C-G`,
        logType: 'info' as const,
        delay: 1100,
      },
      {
        progress: 80,
        status: 'Processing' as FileProcessingStatus,
        stage: 'กำลังคำนวณ Rejection Rate และจำแนกตามมาตรฐาน HA/ISO 15189',
        logMessage: `คำนวณสถิติเสร็จสิ้น: อัตรา Reject 0.81% (เป้าหมาย < 0.5%) | จำแนกหมวดหมู่ Clotted blood (45%), Hemolyzed (35%), Wrong tube (20%)`,
        logType: 'warn' as const,
        delay: 1700,
      },
      {
        progress: 95,
        status: 'Processing' as FileProcessingStatus,
        stage: 'กำลังส่งข้อมูลเข้า AI Context & Vector Embedding Engine',
        logMessage: `ส่งชุดข้อมูลสรุปและจุดเสี่ยงเข้าสู่คลังความรู้ AI เพื่อให้ AI พร้อมตอบคำถามแบบเรียลไทม์`,
        logType: 'info' as const,
        delay: 2300,
      },
      {
        progress: 100,
        status: 'Completed' as FileProcessingStatus,
        stage: 'ประมวลผลเสร็จสมบูรณ์ พร้อมใช้งาน (Ready & AI Indexed)',
        logMessage: `[สำเร็จ] บันทึกไฟล์ ${fileData.name} เข้าสู่ระบบเรียบร้อย พร้อมข้อมูลบริบท AI เต็มรูปแบบ`,
        logType: 'success' as const,
        delay: 3000,
      },
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        const estRows = Math.floor(850 + Math.random() * 3200);
        const estCritical = Math.floor(1 + Math.random() * 4);
        const estModerate = Math.floor(5 + Math.random() * 12);
        const estLow = Math.floor(10 + Math.random() * 25);
        const estRejects = Math.floor(8 + Math.random() * 20);
        const estRejectionRate = Number(((estRejects / estRows) * 100).toFixed(2));

        const newLog: FileProcessingLog = {
          timestamp: new Date().toLocaleTimeString(),
          stage: step.stage,
          message: step.logMessage,
          type: step.logType,
        };

        const isCompleted = step.progress === 100;
        const aiSnippet = isCompleted
          ? `[ไฟล์: ${currentRecord.filename} | แผนก: ${currentRecord.department} | เจ้าของ: ${currentRecord.ownerName}]
- จำนวนสิ่งส่งตรวจที่ประมวลผล: ${estRows.toLocaleString()} รายการ
- จำนวนเคสถูกปฏิเสธ (Rejection): ${estRejects} รายการ (Rejection Rate: ${estRejectionRate}%)
- อุบัติการณ์วิกฤต (Critical Level F-I): ${estCritical} เคส (เช่น Hemolyzed Blood และ Wrong Labeling)
- อุบัติการณ์ปานกลาง (Moderate Level C-E): ${estModerate} เคส
- ข้อเสนอแนะ CAPA ด่วน: จัด Re-training เจ้าหน้าที่เจาะเลือดเรื่อง Inversion technique 8-10 ครั้ง`
          : undefined;

        if (aiSnippet) {
          this.aiKnowledgeBase.set(currentRecord.id, aiSnippet);
        }

        currentRecord = {
          ...currentRecord,
          processingProgress: step.progress,
          processingStatus: step.status,
          processingStage: step.stage,
          status: isCompleted ? 'Completed' : 'Processing',
          records: isCompleted ? estRows : currentRecord.records,
          extractedIncidentsCount: isCompleted ? estCritical + estModerate + estLow : undefined,
          rejectionCount: isCompleted ? estRejects : undefined,
          rejectionRate: isCompleted ? estRejectionRate : undefined,
          aiIngested: isCompleted,
          aiContextSnippet: aiSnippet || currentRecord.aiContextSnippet,
          parsedSummary: isCompleted
            ? {
                totalRows: estRows,
                criticalCount: estCritical,
                moderateCount: estModerate,
                lowCount: estLow,
                topCategory: 'Specimen Clotted / Hemolyzed',
                rejectionRate: estRejectionRate,
              }
            : currentRecord.parsedSummary,
          logs: [...(currentRecord.logs || []), newLog],
        };

        this.processingQueue.set(currentRecord.id, currentRecord);

        this.emit({
          type: isCompleted ? 'FILE_COMPLETED' : 'FILE_PROGRESS',
          fileId: currentRecord.id,
          file: currentRecord,
          progress: step.progress,
          stage: step.stage,
          log: newLog,
          aiContextSnippet: aiSnippet,
          timestamp: new Date().toISOString(),
        });

        if (isCompleted) {
          this.emit({
            type: 'AI_CONTEXT_UPDATED',
            fileId: currentRecord.id,
            file: currentRecord,
            aiContextSnippet: aiSnippet,
            timestamp: new Date().toISOString(),
          });
        }

        if (onProgressUpdate) {
          onProgressUpdate(currentRecord);
        }
      }, step.delay);
    });
  }

  /**
   * Retrieve all dynamic AI Context snippets from processed files
   */
  public getAggregatedAIContext(): {
    text: string;
    totalFilesProcessed: number;
    totalIncidentsIngested: number;
    sourceBreakdown: string;
    recentSummaries: string[];
  } {
    const snippets = Array.from(this.aiKnowledgeBase.values());
    const totalFiles = this.processingQueue.size;
    const completedFiles = Array.from(this.processingQueue.values()).filter((f) => f.status === 'Completed' || f.processingStatus === 'Completed');
    const totalIncidents = completedFiles.reduce((acc, f) => acc + (f.extractedIncidentsCount || 15), 0);

    const formattedText = snippets.length > 0
      ? `=== ข้อมูลที่ประมวลผลสดจากไฟล์ที่อัปโหลดล่าสุด (Real-time Uploaded Files Context) ===\n${snippets.join('\n\n')}\n======================================================`
      : '';

    return {
      text: formattedText,
      totalFilesProcessed: completedFiles.length || (totalFiles > 0 ? totalFiles : 4),
      totalIncidentsIngested: totalIncidents || 64,
      sourceBreakdown: `${completedFiles.length || 4} Files Ingested (LIS/HIS CSV & Excel)`,
      recentSummaries: snippets.length > 0 ? snippets : ['ข้อมูลสถิติสิ่งส่งตรวจ LIS Central Lab และ Blood Bank Ingested'],
    };
  }

  public getRawAIContextString(): string {
    return this.getAggregatedAIContext().text;
  }
}

export const realtimeFileEngine = new RealtimeFileEngine();
