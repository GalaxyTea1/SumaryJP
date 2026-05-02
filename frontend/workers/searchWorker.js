let vocabulary = [];

self.onmessage = function(e) {
    const { type, payload } = e.data;

    switch (type) {
        case 'INIT_DATA':
            vocabulary = payload;
            break;

        case 'UPDATE_ITEM':
            const index = vocabulary.findIndex(v => v.id === payload.id);
            if (index !== -1) {
                vocabulary[index] = payload;
            } else {
                vocabulary.push(payload);
            }
            break;

        case 'SEARCH':
            const { query, requestId } = payload;
            
            if (!query) {
                self.postMessage({ type: 'SEARCH_RESULTS', payload: { results: [], requestId } });
                return;
            }

            // Perform filtering
            const results = vocabulary.filter(v =>
                v.japanese.toLowerCase().includes(query) ||
                v.hiragana.toLowerCase().includes(query) ||
                v.meaning.toLowerCase().includes(query)
            );

            // Simulate heavy load for testing if needed, or just return immediately
            // Since it's a worker, it won't block UI anyway
            self.postMessage({ type: 'SEARCH_RESULTS', payload: { results, requestId } });
            break;
    }
};
