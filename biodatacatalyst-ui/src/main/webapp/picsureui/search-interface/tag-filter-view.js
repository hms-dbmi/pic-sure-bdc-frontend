define(["backbone", "handlebars", "text!search-interface/tag-filter-view.hbs", "search-interface/tag-filter-model", "search-interface/filter-model"],
function(BB, HBS, tagFilterViewTemplate, tagFilterModel, filterModel){
	let studyRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d$');
	let studyVersionRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d');
	let defaultTagLimit = 12;

	let TagFilterView = BB.View.extend({
		initialize: function(opts){
			this.model = tagFilterModel;
			this.onTagChange = opts.onTagChange;
			this.model.get('requiredTags').bind('change add remove', this.modelChanged.bind(this));
			this.model.get('excludedTags').bind('change add remove', this.modelChanged.bind(this));
			filterModel.get("activeFilters").bind('change add remove', this.queryUpdated.bind(this));
		},
		events: {
			'mouseover .badge': 'showTagControls',
			'mouseout .badge': 'hideTagControls',
			'click .badge': 'clickTag',
			'click #show-all-tags-btn': 'showAllTags',
			'click #show-fewer-tags-btn': 'showFewerTags'
		},
		queryUpdated: function(model, collection, opts){
			var studiesInScope = _.map(filterModel.get('activeFilters').models, 
				function(model){
					return  model.toJSON().searchResult.result.metadata.study_id.split('\.')[0];
				});
			if(studiesInScope.length > 0){
				var studyTag = this.model.get("unusedTags").findWhere({tag:studiesInScope[0].toUpperCase()});
				if(studyTag !== undefined){
					this.model.get("unusedTags").remove(studyTag);
					this.model.get("requiredTags").add(studyTag);
					this.model.get("impliedTags").add(studyTag);
				}
			} else {
				this.model.get("requiredTags").remove(this.model.get("impliedTags").models);
				this.model.get("unusedTags").add(this.model.get("impliedTags").models);
				this.model.get("impliedTags").reset(null);
			}
			this.modelChanged();
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
			tagFilterModel.resetPagination({silent:true});
			let tagBtnClicked = this.resolveTagButtonForClick(event);
			if(tagBtnClicked){
				this.model[tagBtnClicked.dataset['action']](tagBtnClicked.dataset['tag']);
			}
		},
		resolveTagButtonForClick: function(event){
			let clickIsInsideTagBtn = function(event, tagBtn){
				let clientRect = tagBtn.getClientRects()[0];
				let relativeX = event.clientX - clientRect.x;
				return relativeX >= 0 && relativeX <= clientRect.width;
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
			this.model.setUnusedTags(response.results.tags, {silent: true});
		},
		modelChanged: function() {
			this.render();
			tagFilterModel.resetPagination({silent:true});
			this.onTagChange();
		},
		render: function(){
			let unusedTags = this.model.get("unusedTags").toArray();
			let tags = _.filter(unusedTags, function(tag){
				return ! studyVersionRegex.test(tag.get('tag'));
			}).map(function(tag){return tag.toJSON();}).slice(0,this.model.get('tagLimit'));
			this.$el.html(HBS.compile(tagFilterViewTemplate)(
				{
					tags: tags,
					tagsTotal: this.model.get("unusedTags").size(),
					tagsShown: Math.min(this.model.get("tagLimit"),this.model.get("unusedTags").size()),
					tagsLimited: this.model.get('tagLimit') == defaultTagLimit,
					hasRequiredTags:this.model.hasRequiredTags(),
					hasExcludedTags:this.model.hasExcludedTags(),
					hasInactiveStudyTags:this.model.hasInactiveStudyTags(),
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