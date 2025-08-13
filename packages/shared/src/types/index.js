/**
 * @fileoverview Shared TypeScript types for CritGenius Listener
 * Common types used across client and server applications
 */
/**
 * Audio processing status enumeration
 */
export var AudioProcessingStatus;
(function (AudioProcessingStatus) {
    AudioProcessingStatus["PENDING"] = "pending";
    AudioProcessingStatus["PROCESSING"] = "processing";
    AudioProcessingStatus["COMPLETED"] = "completed";
    AudioProcessingStatus["FAILED"] = "failed";
})(AudioProcessingStatus || (AudioProcessingStatus = {}));
//# sourceMappingURL=index.js.map