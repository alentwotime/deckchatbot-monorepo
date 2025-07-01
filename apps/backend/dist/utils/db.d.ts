export default dbService;
declare const dbService: DatabaseService;
declare class DatabaseService {
    pool: any;
    query(text: any, params?: any[]): Promise<any>;
    cachedQuery(text: any, params?: any[], ttl?: number): Promise<any>;
    transaction(callback: any): Promise<any>;
    batchInsert(table: any, columns: any, values: any): Promise<any>;
    getTableStats(tableName: any): Promise<any>;
    createIndexIfNotExists(indexName: any, tableName: any, columns: any, options?: {}): Promise<void>;
    initializeIndexes(): Promise<void>;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=db.d.ts.map