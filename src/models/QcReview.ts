// src/models/QcReview.ts
import { ObjectId, type Collection, type Db } from "mongodb";
import { getMongoClient } from "../lib/mongodb";

export type QcResult = "pass" | "fail";
export type QcItemStatus = "ok" | "warning" | "fail";
export type Severity = "minor" | "major" | "critical";

export type QcChecklist = {
  ui: QcItemStatus;
  audio: QcItemStatus;
  logic: QcItemStatus;
  performance?: QcItemStatus;
  content?: QcItemStatus;
};

export interface QcReview {
  _id: ObjectId;
  gameId: ObjectId;
  versionId: ObjectId;

  reviewerId: ObjectId;
  reviewerEmail: string;

  result: QcResult;
  severity?: Severity; // required if fail
  checklist: QcChecklist;
  note?: string;

  createdAt: Date;
}

export type CreateQcReviewInput = Omit<QcReview, "_id" | "createdAt">;

export class QcReviewRepository {
  private collection: Collection<QcReview>;

  constructor(db: Db) {
    this.collection = db.collection<QcReview>("qc_reviews");
  }

  static async getInstance(): Promise<QcReviewRepository> {
    const { db } = await getMongoClient();
    return new QcReviewRepository(db);
  }

  async countByVersionId(versionId: string): Promise<number> {
    if (!ObjectId.isValid(versionId)) return 0;
    return this.collection.countDocuments({ versionId: new ObjectId(versionId) });
  }

  async create(input: CreateQcReviewInput): Promise<QcReview> {
    if (!input.gameId) throw new Error("gameId is required");
    if (!input.versionId) throw new Error("versionId is required");
    if (!input.reviewerId) throw new Error("reviewerId is required");
    if (!input.reviewerEmail) throw new Error("reviewerEmail is required");
    if (!input.result) throw new Error("result is required");
    if (input.result === "fail" && !input.severity) {
      throw new Error('severity is required when result is "fail"');
    }

    const doc: Omit<QcReview, "_id"> = { ...input, createdAt: new Date() };
    const res = await this.collection.insertOne(doc as QcReview);
    return { ...doc, _id: res.insertedId } as QcReview;
  }

  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ versionId: 1, createdAt: -1 });
    await this.collection.createIndex({ gameId: 1, createdAt: -1 });
    await this.collection.createIndex({ reviewerId: 1, createdAt: -1 });
  }
}
