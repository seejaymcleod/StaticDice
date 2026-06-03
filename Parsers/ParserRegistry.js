const ParserRegistry = {
    parsers: [],
    
    register(parser) {
        this.parsers.push(parser);
    },
    
    detectAndImport(data, ctx) {
        for (const parser of this.parsers) {
            if (parser.detect(data)) {
                return {
                    importerName: parser.name,
                    result: parser.parse(data, ctx)
                };
            }
        }
        return null; // Return null if no parser matches
    }
};
