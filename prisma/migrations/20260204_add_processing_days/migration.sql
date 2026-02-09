-- AddProcessingDays
ALTER TABLE "AppSettings" ADD COLUMN "processingDays" TEXT NOT NULL DEFAULT '1,2,3,4,5';
