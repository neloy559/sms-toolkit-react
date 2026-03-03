import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IHistory extends Document {
    user_id?: string; // Optional if you want to support anonymous usage logged by IP or just aggregate metrics
    toolName: string; // The tool used, e.g., 'Number Extractor Pro', 'SMS CDR Pro'
    action: string;   // Description of the action, e.g., 'Extracted 500 numbers from xlsx'
    details?: Record<string, unknown>; // Additional metadata like countries detected, etc.
    createdAt: Date;
}

const HistorySchema: Schema<IHistory> = new Schema(
    {
        user_id: {
            type: String,
            required: false, // Make false so tools are 100% accessible without login
        },
        toolName: {
            type: String,
            required: true,
            index: true,
        },
        action: {
            type: String,
            required: true,
        },
        details: {
            type: Object, // Store arbitrary JSON data
            required: false,
        },
    },
    { timestamps: true }
);

const History: Model<IHistory> = mongoose.models.History || mongoose.model<IHistory>('History', HistorySchema);

export default History;
