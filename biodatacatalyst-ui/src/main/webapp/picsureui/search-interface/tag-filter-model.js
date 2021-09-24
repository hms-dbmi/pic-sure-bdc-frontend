define(["backbone", "handlebars", "search-interface/search-util"],
    function(BB, HBS, searchUtil){
        let studyVersionRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d');
        let defaultTagLimit = 12;

        let TagFilterModel = BB.Model.extend({
            defaults:{
                requiredTags: new BB.Collection,
                excludedTags: new BB.Collection,
                unusedTags: new BB.Collection,
                impliedTags: new BB.Collection,
                term:"",
                currentPage: 1,
                limit:10,
                searchResults: undefined
            },
            initialize: function(opts){
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
            reset: function(options){
                this.get('unusedTags').add(this.get('requiredTags').models);
                this.get('unusedTags').add(this.get('excludedTags').models);
                this.get('requiredTags').reset();
                this.get('excludedTags').reset();
                this.get('requiredTags').add(this.get('impliedTags').models, {silent:true});
                this.get('unusedTags').remove(this.get('impliedTags').models, {silent:true});
                this.set(this.defaults, options);
            },
            resetPagination: function(options){
                this.set("currentPage", 1, options);
            },
            hasRequiredTags: function(){
                return this.get('requiredTags').length>0;
            },
            hasExcludedTags: function(){
                return this.get('excludedTags').length>0;
            },
            hasInactiveStudyTags: function(){
                return this.get("unusedTags").filter(function(tag){
                        return studyVersionRegex.test(tag.get('tag'));
                }).length>0;
            },
            requireTag: function(tagName){
                this.removeExcludedTag(tagName);
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
            excludeTag: function(tagName){
                this.removeRequiredTag(tagName);
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
            setUnusedTags: function(tags, options) {
                tags = _.filter(tags,(tag)=>{
                    return this.get('requiredTags').findWhere({tag:tag.tag}) === undefined;
                });
                this.get('unusedTags').set(tags, options);
                this.get('unusedTags').remove(this.get('requiredTags').models, options);
            }
        });
        return new TagFilterModel();
    });