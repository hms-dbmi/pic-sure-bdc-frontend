define(["backbone", "handlebars", "search-interface/search-util"],
    function(BB, HBS, searchUtil){
        let studyVersionRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d');
        let defaultTagLimit = 12;

        let TagFilterModel = BB.Model.extend({
            defaults:{
                requiredTags: new BB.Collection,
                excludedTags: new BB.Collection,
                unusedTags: new BB.Collection
            },
            initialize: function(opts){
                this.set('requiredTags', new BB.Collection);
                this.set('excludedTags', new BB.Collection);
                this.set('unusedTags', new BB.Collection);
                this.set('tagLimit', defaultTagLimit);
                HBS.registerHelper("aliasIfStudy", function(tag){
                    if(studyVersionRegex.test(tag)){
                        return searchUtil.findStudyAbbreviationFromId(tag);
                    }
                    return tag;
                });
                HBS.registerHelper("colorClass", function(tag){
                    if(studyVersionRegex.test(tag)){
                        return 'study-badge';
                    }
                    return 'tag-badge';
                });
                let tagComparator = function(a, b){
                    return b.get('score') - a.get('score');
                };
                this.get('requiredTags').comparator = tagComparator;
                this.get('excludedTags').comparator = tagComparator;
                this.get('unusedTags').comparator = tagComparator;
            },
            hasRequiredTags: function(){
                return this.get('requiredTags').length>0;
            },
            hasExcludedTags: function(){
                return this.get('excludedTags').length>0;
            },
            requireTag: function(tag){
                let tagName = searchUtil.findStudyAbbreviationFromId(tag);
                if (this.get('requiredTags').findWhere({tag: tagName})) {
                    return;
                }
                var unusedTags = this.get('unusedTags');
                var targetTag = unusedTags.findWhere({tag: tagName});

                if (targetTag === undefined) {
                    targetTag = {tag: tagName, score: 0}
                } else {
                    unusedTags.remove(targetTag);
                }
                this.get('requiredTags').add(targetTag);
            },
            excludeTag: function(tag){
                let tagName = searchUtil.findStudyAbbreviationFromId(tag);
                if (this.get('excludedTags').findWhere({tag: tagName})) {
                    return;
                }
                var unusedTags = this.get('unusedTags');
                var targetTag = unusedTags.findWhere({tag: tagName});

                if (targetTag === undefined) {
                    targetTag = {tag: tagName, score: 0}
                } else {
                    unusedTags.remove(targetTag);
                }
                this.get('excludedTags').add(targetTag);
            },
            removeRequiredTag: function(tag){
                var unusedTags = this.get('unusedTags');
                var requiredTags = this.get('requiredTags');
                var targetTag = requiredTags.findWhere({tag: tag});

                requiredTags.remove(targetTag);
                unusedTags.add(targetTag);
                this.set('unusedTags', unusedTags);
                this.set('requiredTags', requiredTags);
            },
            removeExcludedTag: function(tag){
                var unusedTags = this.get('unusedTags');
                var excludedTags = this.get('excludedTags');
                var targetTag = excludedTags.findWhere({tag: tag});

                excludedTags.remove(targetTag);
                unusedTags.add(targetTag);
                this.set('unusedTags', unusedTags);
                this.set('excludedTags', excludedTags);
            },
            setUnusedTags: function(tags) {
                this.set('unusedTags', new BB.Collection);
                this.get('unusedTags').add(tags);
            }
        });
        return new TagFilterModel();
    });