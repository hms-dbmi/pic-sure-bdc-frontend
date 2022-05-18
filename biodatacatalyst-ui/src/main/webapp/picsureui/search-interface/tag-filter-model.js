define(["backbone", "handlebars", "search-interface/search-util"],
    function(BB, HBS, searchUtil){
        let studyVersionRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d');
        let dccHarmonizedTag = 'dcc harmonized data set';
        let defaultTagLimit = 12;

        let TagCollection = BB.Collection.extend({
            comparator:function(a){
                    return -a.get('score');
            }
        });

        let TagFilterModel = BB.Model.extend({
            defaults:{
                requiredTags: new TagCollection,
                excludedTags: new TagCollection,
                unusedTags: new TagCollection,
                impliedTags: new TagCollection,
                term:"",
                currentPage: 1,
                limit:10,
                searchResults: undefined
            },
            initialize: function(opts){
                this.set('tagLimit', defaultTagLimit);
                this.set('focusedTag', 0);
                this.set('focusedSection', undefined);
                this.set('numTags', 0);
                HBS.registerHelper("aliasIfStudy", function(tag){
                    if(tag===dccHarmonizedTag || studyVersionRegex.test(tag)){
                        return searchUtil.findStudyAbbreviationFromId(tag);
                    }
                    return tag;
                });
                HBS.registerHelper("ariaAliasIfStudy", function(tag){
                    if(tag===dccHarmonizedTag || studyVersionRegex.test(tag)){
                        return "Study " + searchUtil.findStudyAbbreviationFromId(tag).split('').join('.');
                    }
                    return tag;
                });
                HBS.registerHelper("colorClass", function(tag){
                    if(tag===dccHarmonizedTag || studyVersionRegex.test(tag)){
                        return 'study-badge';
                    }
                    return 'tag-badge';
                });
                HBS.registerHelper('isStudy', function(arg1, options) {
                    return (arg1===dccHarmonizedTag || studyVersionRegex.test(arg1)) ? options.fn(this) : options.inverse(this);
                });
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
            decrementTagFocus: function(){
                this.set("focusedTag", this.get("focusedTag") - 1);
            },
            incrementTagFocus: function(){
                this.set("focusedTag", this.get("focusedTag") + 1);
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
                        return tag.get('tag')===dccHarmonizedTag || studyVersionRegex.test(tag.get('tag'));
                }).length>0;
            },
            requireTag: function(tagName){
                if (tagName) tagName = tagName.toLowerCase();
                this.removeExcludedTag(tagName);
                if (this.get('requiredTags').findWhere({tag: tagName})) {
                    return;
                }
                var unusedTags = this.get('unusedTags');
                var targetTag = _.filter(unusedTags.models, function(model) {return model.attributes.tag.toLowerCase() === tagName.toLowerCase()});

                if (targetTag.length == 0) {
                    targetTag = {tag: tagName, score: 0};
                    this.get('requiredTags').add(targetTag);
                } else {
                    let i = targetTag.length;
                    while(i > 0){
                        unusedTags.remove(targetTag[i-1]);
                        i--;
                    }
                    this.get('requiredTags').add(targetTag[0]);
                }

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
                this.set('unusedTags', unusedTags, {silent:true});
                this.set('requiredTags', requiredTags);
            },
            removeExcludedTag: function(tag){
                var unusedTags = this.get('unusedTags');
                var excludedTags = this.get('excludedTags');
                var targetTag = excludedTags.findWhere({tag: tag});

                excludedTags.remove(targetTag);
                unusedTags.add(targetTag);
                this.set('unusedTags', unusedTags, {silent:true});
                this.set('excludedTags', excludedTags);
            },
            setUnusedTags: function(tags, options) {

                let filteredTags = _.chain(tags).sortBy(function(tag){
                    return tag.score;
                }).sortBy(function(tag){
                    return tag.tag.toLowerCase();
                }).value();
                filteredTags = _.chain(filteredTags).uniq(function(tag){return tag.tag.toLowerCase();
                }).filter((tag)=>{
                    return (this.get('requiredTags').findWhere({tag:tag.tag.toUpperCase()}) === undefined && this.get('requiredTags').findWhere({tag:tag.tag.toLowerCase()}) === undefined &&
                        this.get('excludedTags').findWhere({tag:tag.tag.toUpperCase()}) === undefined &&
                        this.get('excludedTags').findWhere({tag:tag.tag.toLowerCase()}) === undefined);
                }).value();

                this.get('requiredTags').models.forEach((currentTag)=>{
                    _.each(tags, (tag) => {
                        if (currentTag.attributes.tag.toLowerCase() === tag.tag.toLowerCase() ) {
                            currentTag.attributes.score = tag.score;
                        }
                    });
                });

                this.get('unusedTags').set(filteredTags, options);
                this.get('unusedTags').remove(this.get('requiredTags').models, options);
            }

        });
        return new TagFilterModel();
    });
