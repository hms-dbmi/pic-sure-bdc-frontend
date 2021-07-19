define(["backbone", "handlebars", "text!search-interface/tag-filter-view.hbs"],
function(BB, HBS, tagFilterViewTemplate){
	let studyRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d$');
	let studyVersionRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d');
	let findStudyAbbreviationFromId;
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
					return findStudyAbbreviationFromId(tag);
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
			this.get('unusedTags').add(opts.results.tags);
		},
		hasRequiredTags: function(){
			return this.get('requiredTags').length>0;
		},
		hasExcludedTags: function(){
			return this.get('excludedTags').length>0;
		},
		setUnusedTags: function(tags) {
			this.set('unusedTags', new BB.Collection);
			this.get('unusedTags').add(tags);
		}
	});

	let TagFilterView = BB.View.extend({
		initialize: function(opts){
			this.response = opts.tagSearchResponse;
			findStudyAbbreviationFromId = opts.findStudyAbbreviationFromId;
			this.model = new TagFilterModel(opts.tagSearchResponse);
			this.onTagChange = opts.onTagChange;
		},
		events: {
			'mouseover .badge': 'showTagControls',
			'mouseout .badge': 'hideTagControls',
			'click .require-tag-btn': 'requireTag',
			'click .exclude-tag-btn': 'excludeTag',
			'click .remove-required-tag-btn': 'removeRequiredTag',
			'click .remove-excluded-tag-btn': 'removeExcludedTag',
			'click .badge': 'clickTag',
			'click #show-all-tags-btn': 'showAllTags',
			'click #show-fewer-tags-btn': 'showFewerTags'
		},
		showAllTags: function(event){
			this.model.set('tagLimit', 1000000);
			this.render();
		},
		showFewerTags: function(event){
			this.model.set('tagLimit', defaultTagLimit);
			this.render();
		},
		showTagControls: function(event){
			$('.hover-control', event.target).show();
		},
		hideTagControls: function(event){
			$('.hover-control', event.target).hide();
		},
		clickTag: function(event){
			let tagBtnClicked = this.resolveTagButtonForClick(event);
			if(tagBtnClicked){
				this[tagBtnClicked.dataset['action']](tagBtnClicked.dataset['tag']);
			}
		},
		resolveTagButtonForClick: function(event){
			let clickIsInsideTagBtn = function(event, tagBtn){
				let clickXRelativeToTagBtn = (event.offsetX - (tagBtn.offsetLeft - event.target.offsetLeft));
				return clickXRelativeToTagBtn > 0 && (clickXRelativeToTagBtn - tagBtn.offsetWidth) < tagBtn.offsetWidth;
			}
			let tagBtnClicked;
			_.each($('.hover-control', event.target), tagBtn=>{
				if(clickIsInsideTagBtn(event, tagBtn)){
					tagBtnClicked = tagBtn;
				}
			});
			return tagBtnClicked;
		},
		requireTag: function(tag){
			var unusedTags = this.model.get('unusedTags');
			var requiredTags = this.model.get('requiredTags');
			var targetTag = unusedTags.findWhere({tag: tag});

			unusedTags.remove(targetTag);
			requiredTags.add(targetTag);
			this.render();
			this.onTagChange();
		},
		excludeTag: function(tag){
			var unusedTags = this.model.get('unusedTags');
			var excludedTags = this.model.get('excludedTags');
			var targetTag = unusedTags.findWhere({tag: tag});

			unusedTags.remove(targetTag);
			excludedTags.add(targetTag);
			this.render();
			this.onTagChange();
		},
		removeRequiredTag: function(tag){
			var unusedTags = this.model.get('unusedTags');
			var requiredTags = this.model.get('requiredTags');
			var targetTag = requiredTags.findWhere({tag: tag});

			requiredTags.remove(targetTag);
			unusedTags.add(targetTag);
			this.render();
			this.onTagChange();
		},
		removeExcludedTag: function(tag){
			var unusedTags = this.model.get('unusedTags');
			var excludedTags = this.model.get('excludedTags');
			var targetTag = excludedTags.findWhere({tag: tag});

			excludedTags.remove(targetTag);
			unusedTags.add(targetTag);
			this.render();
			this.onTagChange();
		},
		updateTags: function(response) {
			this.response = response;
			this.model.setUnusedTags(response.results.tags);
		},
		render: function(){
			let unusedTags = this.model.get("unusedTags").toArray();
			this.$el.html(HBS.compile(tagFilterViewTemplate)(
				{
					tags:_.filter(unusedTags, function(tag){
						return ! studyVersionRegex.test(tag.get('tag'));
					}).map(function(tag){return tag.toJSON();}).slice(0,this.model.get('tagLimit')),
					tagsTotal: this.model.get("unusedTags").size(),
					tagsShown: Math.min(this.model.get("tagLimit"),this.model.get("unusedTags").size()),
					tagsLimited: this.model.get('tagLimit') == defaultTagLimit,
					hasRequiredTags:this.model.hasRequiredTags(),
					hasExcludedTags:this.model.hasExcludedTags(),
					hasActiveTags: this.model.hasExcludedTags() || this.model.hasRequiredTags(),
					requiredTags:this.model.get("requiredTags").map(function(tag){return tag.toJSON();}),
					excludedTags:this.model.get("excludedTags").map(function(tag){return tag.toJSON();}),
					studyTags:
						_.filter(unusedTags, function(tag){
							return studyRegex.test(tag.get('tag'));
						}).map(function(tag){return tag.toJSON();})
				})
			);
		}
	});
	return TagFilterView;
});