define(["backbone", "handlebars", "text!search-interface/tag-filter-view.hbs", "search-interface/tag-filter-model"],
function(BB, HBS, tagFilterViewTemplate, TagFilterModel){
	let studyRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d$');
	let studyVersionRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d');
	let defaultTagLimit = 12;

	let TagFilterView = BB.View.extend({
		initialize: function(opts){
			this.response = opts.tagSearchResponse;
			this.model = TagFilterModel;
			this.onTagChange = opts.onTagChange;
			this.model.get('requiredTags').bind('change add remove', function () {
				this.modelChanged();
			}.bind(this));
			this.model.get('excludedTags').bind('change add remove', function () {
				this.modelChanged();
			}.bind(this));
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
		},
		showFewerTags: function(event){
			this.model.set('tagLimit', defaultTagLimit);
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
				this.model[tagBtnClicked.dataset['action']](tagBtnClicked.dataset['tag']);
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
		updateTags: function(response) {
			this.response = response;
			this.model.setUnusedTags(response.results.tags);
		},
		modelChanged: function() {
			this.render();
			this.onTagChange();
		},
		render: function(){
			console.log("rendering tags");
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