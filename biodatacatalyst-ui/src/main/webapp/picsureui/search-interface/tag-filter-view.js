define(["backbone", "handlebars", "text!search-interface/tag-filter-view.hbs", "search-interface/tag-filter-model", "search-interface/filter-model", "common/keyboard-nav", "search-interface/search-util", "search-interface/open-picsure-tag-help-view", "search-interface/modal"],
function(BB, HBS, tagFilterViewTemplate, tagFilterModel, filterModel, keyboardNav, searchUtil, helpView, modal){
	let studyRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d$');
	let studyVersionRegex = new RegExp('[pP][hH][sS]\\d\\d\\d\\d\\d\\d');
	let tableRegex = new RegExp('[pP][hH][tT]\\d\\d\\d\\d\\d\\d$');
	let tableVersionRegex = new RegExp('[pP][hH][tT]\\d\\d\\d\\d\\d\\d');
    let dccHarmonizedTag = 'DCC Harmonized data set';
	let defaultTagLimit = 12;

	let TagFilterView = BB.View.extend({
		initialize: function(opts){
			this.isOpenAccess = opts.isOpenAccess;
			this.model = tagFilterModel;
			this.helpView = new helpView();
			this.onTagChange = opts.onTagChange;
			this.model.get('requiredTags').bind('change add remove', this.modelChanged.bind(this));
			this.model.get('excludedTags').bind('change add remove', this.modelChanged.bind(this));
			filterModel.get("activeFilters").bind('change add remove', this.queryUpdated.bind(this));
			keyboardNav.addNavigableView("tagFilters",this);
			this.on({
				'keynav-arrowup document': this.previousTag,
				'keynav-arrowdown document': this.nextTag,
				'keynav-arrowright document': this.nextTag,
				'keynav-arrowleft document': this.previousTag,
				'keynav-+': this.requireTag,
				'keynav-minus': this.excludeTag,
				'keynav-=': this.requireTag,
				'keynav-enter document': this.unuseTag
			});
		},
		events: {
			'mouseover .badge': 'showTagControls',
			'mouseout .badge': 'hideTagControls',
			'click .badge': 'clickTag',
			'click #show-all-tags-btn': 'showAllTags',
			'click #show-fewer-tags-btn': 'showFewerTags',
			'focus #active-tags-section-div': 'activeTagFocus',
			'blur #active-tags-section-div': 'activeTagBlur',
			'focus #study-tags-section-div': 'studyTagFocus',
			'blur #study-tags-section-div': 'studyTagBlur',
			'focus #tags-section-div': 'tagFocus',
			'blur #tags-section-div': 'tagBlur',
			'click #tag-help' : 'openTagHelp'
		},
		requireTag: function(event){
			let focusedTag = $('.focused-tag-badge')[0];
			if(focusedTag){
				this.model.requireTag(focusedTag.id.split('-')[1]);
			}
		},
		excludeTag: function(event){
			let focusedTag = $('.focused-tag-badge')[0];
			if(focusedTag){
				this.model.excludeTag(focusedTag.id.split('-')[1]);
			}
		},
		unuseTag: function(event){
			let focusedTag = $('.focused-tag-badge')[0];
			if(focusedTag){
				this.model.removeExcludedTag(focusedTag.id.split('-')[1]);
				this.model.removeRequiredTag(focusedTag.id.split('-')[1]);
			}
		},
		previousTag: function(event){
			let tags = this.$(this.model.get("focusedSection") + " .section-body .badge");
			let focusedTag = 1;
			for(var x = 0;x < tags.length;x++){
				if($(tags[x]).hasClass('focused-tag-badge')){
					focusedTag = x;
					$('.focused-tag-badge .hover-control').css('visibility','hidden');
					$(tags[x]).removeClass('focused-tag-badge');
				}
			}
			if(focusedTag===0){
				focusedTag = tags.length;
			}
			$(tags[focusedTag - 1]).addClass('focused-tag-badge');
			$(this.model.get('focusedSection')).attr('aria-activedescendant',$('.focused-tag-badge')[0].id);
			$('.focused-tag-badge .hover-control').css('visibility','visible');
			searchUtil.ensureElementIsInView($('.focused-tag-badge')[0]);
		},
		nextTag: function(event){
			let tags = this.$(this.model.get("focusedSection") + " .section-body .badge");
			let focusedTag = -1;
			for(var x = 0;x < tags.length;x++){
				if($(tags[x]).hasClass('focused-tag-badge')){
					focusedTag = x;
					$('.focused-tag-badge .hover-control').css('visibility','hidden');
					$(tags[x]).removeClass('focused-tag-badge');
				}
			}
			$(tags[(focusedTag + 1) % tags.length]).addClass('focused-tag-badge');
			$(this.model.get('focusedSection')).attr('aria-activedescendant',$('.focused-tag-badge')[0].id);
			$('.focused-tag-badge .hover-control').css('visibility','visible');
			searchUtil.ensureElementIsInView($('.focused-tag-badge')[0]);
		},
		studyTagKeypress: function(event){
			console.log(event);
			switch(event.key){
				case 'a':{
					this.model.decrementTagFocus();
					this.render();
					break;
				}
				case 'z':{
					this.model.incrementTagFocus();
					this.render();
					break;
				}
				default: {
					console.log(event.keyCode);
				}
			}
		},
		activeTagFocus: function(){
			this.model.set('focusedSection', '#active-tags-section-div', {silent:true});
			this.nextTag();
			keyboardNav.setCurrentView("tagFilters");
		},
		activeTagBlur: function(){
			this.model.set('focusedSection', undefined, {silent:true});
			$('.focused-tag-badge .hover-control').css('visibility','hidden');
			this.$("#active-tags-section-div .section-body .focused-tag-badge").removeClass('focused-tag-badge');
			keyboardNav.setCurrentView(undefined);
		},
		tagFocus: function(){
			this.model.set('focusedSection', '#tags-section-div', {silent:true});
			this.nextTag();
			keyboardNav.setCurrentView("tagFilters");
		},
		tagBlur: function(){
			this.model.set('focusedSection', undefined, {silent:true});
			$('.focused-tag-badge .hover-control').css('visibility','hidden');
			this.$("#tags-section-div .section-body .focused-tag-badge").removeClass('focused-tag-badge');
			keyboardNav.setCurrentView(undefined);
		},
		studyTagFocus: function(){
			this.model.set('focusedSection', '#study-tags-section-div', {silent:true});
			this.nextTag();
			keyboardNav.setCurrentView("tagFilters");
		},
		studyTagBlur: function(){
			this.model.set('focusedSection', undefined, {silent:true});
			$('.focused-tag-badge .hover-control').css('visibility','hidden');
			this.$("#study-tags-section-div .section-body .focused-tag-badge").removeClass('focused-tag-badge');
			keyboardNav.setCurrentView(undefined);
		},
		queryUpdated: function(model, collection, opts){
			var studiesInScope = _.filter(filterModel.get('activeFilters').models, (model) => {model.toJSON().searchResult !== undefined})
								  .map((model) => {return model.toJSON().searchResult.studyId});

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
			$('.hover-control', event.target).css("visibility", "visible").hover(function() {
				$(this).css("visibility", "visible");
				$(this).css("cursor", "pointer");
			})
			if ($(event.target).hasClass('stack')){
				$(event.target).siblings('.hover-control').css("visibility", "visible");
			}
		},
		hideTagControls: function(event){
			$('.hover-control', event.target).css("visibility", "hidden");
			if ($(event.target).hasClass('stack')){
				$(event.target).siblings('.hover-control').css("visibility", "hidden");
			}
		},
		clickTag: function(event){
			if(event.target && event.target.classList.contains('hover-control')){
				this.model[event.target.dataset['action']](event.target.dataset['tag']);
			}
		},
		updateTags: function(response) {
			this.model.setUnusedTags(response.results.tags, {silent: true});
		},
		modelChanged: function() {
			this.render();
			tagFilterModel.resetPagination({silent:true});
			this.onTagChange();
		},
		determineStudyTags: function(unusedTags){
			let filteredTags = _.chain(unusedTags).filter(function(tag){
				return (tag.get('tag')===dccHarmonizedTag || studyRegex.test(tag.get('tag')));
			}).sortBy(function(tag){
				return tag.get('score');
			}).sortBy(function(tag){
				return tag.get('tag').toLowerCase();
			}).value()
			let studyTags = _.uniq(filteredTags, function(tag){return tag.get('tag').toLowerCase();}).map(function(tag){
				tag.set('tag', tag.get('tag').toLowerCase());
				return tag.toJSON();
			})
			return studyTags;
		},
		openTagHelp: function(event){
			modal.displayModal(
                this.helpView,
                'Tool Suite Help',
                () => {
                    $('#tool-suite').focus();
                }
            );
		},
		render: function(){
			let unusedTags = this.model.get("unusedTags").toArray();
			let tags = _.filter(unusedTags, function(tag){
				return ! (tag.get('tag')===dccHarmonizedTag || studyVersionRegex.test(tag.get('tag'))) && ! tableVersionRegex.test(tag.get('tag'));
			}).map(function(tag){return tag.toJSON();}).slice(0,this.model.get('tagLimit'));
			this.model.set('numTags', Math.min(this.model.get("tagLimit"),this.model.get("unusedTags").size()), {silent:true})
			this.model.set('focusedTag', this.model.get('numTags') * 1000000, {silent:true});
			this.$el.html(HBS.compile(tagFilterViewTemplate)(
				{
					tags: tags,
					isOpenAccess: this.isOpenAccess,
					searchTerm: $('#search-box').val(),
					numSearchResults: this.model.get("searchResults") ? this.model.get("searchResults").results.numResults : 0,
					numActiveTags: this.model.get("requiredTags").size() + this.model.get("excludedTags").size(),
					tagsTotal: this.model.get("unusedTags").size(),
					tagsShown: this.model.get('numTags'),
					tagsLimited: this.model.get('tagLimit') == defaultTagLimit,
					hasRequiredTags:this.model.hasRequiredTags(),
					hasExcludedTags:this.model.hasExcludedTags(),
					hasInactiveStudyTags:this.model.hasInactiveStudyTags(),
					hasActiveTags: this.model.hasExcludedTags() || this.model.hasRequiredTags(),
					requiredTags:this.model.get("requiredTags").map(function(tag){
						return tag.toJSON();
					}),
					excludedTags:this.model.get("excludedTags").map(function(tag){return tag.toJSON();}),
					studyTags: this.determineStudyTags(unusedTags)
				})
			);
			$('.study-badge-'+this.model.get('focusedTag')).addClass('focused-tag-badge');
			$('.tag-badge-'+this.model.get('focusedTag')).addClass('focused-tag-badge');
		}
	});
	return TagFilterView;
});
