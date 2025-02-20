const storageManager = {
    async checkStorageQuota() {
        if (navigator.storage && navigator.storage.estimate) {
            const {usage, quota} = await navigator.storage.estimate();
            const percentageUsed = (usage / quota) * 100;
            
            if (percentageUsed > 80) {
                this.showStorageWarning(percentageUsed);
            }
        }
    },

    async exportData() {
        try {
            const allData = await dbManager.getAllVocabulary();
            const metadata = {
                exportDate: new Date().toISOString(),
                version: dbManager.DB_VERSION,
                totalWords: allData.length
            };
            
            const exportData = { metadata, vocabulary: allData };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], 
                {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `japanese-vocab-backup-${new Date().toISOString()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            alert('Có lỗi khi export dữ liệu. Vui lòng thử lại.');
        }
    },

    async importData(file) {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            if (!importData.metadata || !importData.vocabulary) {
                throw new Error('Invalid backup file format');
            }

            if (!confirm(`Import ${importData.vocabulary.length} từ vựng?`)) {
                return;
            }

            for (const vocab of importData.vocabulary) {
                delete vocab.id;
                await dbManager.saveVocabulary(vocab);
            }

            alert('Import thành công!');
            await vocabularyManager.loadFromIndexedDB();
        } catch (error) {
            console.error('Import error:', error);
            alert('Có lỗi khi import dữ liệu. Vui lòng kiểm tra file backup.');
        }
    }
}; 