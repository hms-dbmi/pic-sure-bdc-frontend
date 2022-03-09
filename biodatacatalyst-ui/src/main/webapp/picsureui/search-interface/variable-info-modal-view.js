define([
  "jquery",
  "backbone",
  "handlebars",
  "text!search-interface/variable-info-modal-template.hbs",
  "search-interface/tag-filter-model",
  "text!options/modal.hbs",
  "search-interface/variable-info-cache",
  "search-interface/filter-model",
  "search-interface/categorical-filter-modal-view",
  "search-interface/numerical-filter-modal-view",
  "search-interface/datatable-filter-modal-view",
  "search-interface/modal",
], function (
  $,
  BB,
  HBS,
  dataTableInfoTemplate,
  tagFilterModel,
  modalTemplate,
  variableInfoCache,
  filterModel,
  categoricalFilterModalView,
  numericalFilterModalView,
  datatableFilterModalView,
  modal
) {
  var View = BB.View.extend({
    initialize: function (opts) {
      this.dataTableInfoTemplate = HBS.compile(dataTableInfoTemplate);
      this.modalTemplate = HBS.compile(modalTemplate);
      this.varId = opts.varId;
    },
    events: {
      "mouseover .badge": "showTagControls",
      "mouseout .badge": "hideTagControls",
      "click .require-tag-btn": "requireTag",
      "click .exclude-tag-btn": "excludeTag",
      "click .remove-required-tag-btn": "removeRequiredTag",
      "click .remove-excluded-tag-btn": "removeExcludedTag",
      "click .badge": "clickTag",
      "click #show-all-tags-btn": "showAllTags",
      "click #show-fewer-tags-btn": "showFewerTags",
      "click .fa-filter": "filterClickHandler",
      "click .fa-database": "databaseClickHandler",
      "keypress .fa-filter": "filterKeypressHandler",
      "keypress .fa-database": "databaseKeypressHandler",
    },
    showTagControls: function (event) {
      $(".hover-control", event.target).show();
    },
    hideTagControls: function (event) {
      $(".hover-control", event.target).hide();
    },
    clickTag: function (event) {
      let tagBtnClicked = this.resolveTagButtonForClick(event);
      if (tagBtnClicked) {
        tagFilterModel[tagBtnClicked.dataset["action"]](
          tagBtnClicked.dataset["tag"]
        );
      }
    },
    filterClickHandler: function (event) {
      let variableId = _.find($(".modal .fa-filter"), (filterButton) => {
        return filterButton.dataset.target === "variable";
      }).dataset.id;

      let searchResult = _.find(
        tagFilterModel.attributes.searchResults.results.searchResults,
        function (variable) {
          return variable.result.varId === variableId;
        }
      );

      if (event.target.dataset.target === "variable") {
        let filter = filterModel.getByVarId(searchResult.result.varId);

        let filterViewData = {
          searchResult: searchResult,
          filter: filter ? filter.toJSON() : undefined,
        };

        if (!_.isEmpty(searchResult.result.values)) {
          this.filterModalView = new categoricalFilterModalView({
            data: filterViewData,
            el: $(".modal-body"),
          });
        } else {
          this.filterModalView = new numericalFilterModalView({
            data: filterViewData,
            el: $(".modal-body"),
          });
        }
        this.filterModalView.render();
        modal.displayModal(
          this.filterModalView,
          searchResult.result.metadata.description
        );
      }
      if (event.target.dataset.target === "datatable") {
        let filter = filterModel.getByDatatableId(event.target.dataset.id);

        $.ajax({
          url:
            window.location.origin +
            "/picsure/search/36363664-6231-6134-2D38-6538652D3131",
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify({
            query: {
              searchTerm: "",
              includedTags: [event.target.dataset.id],
              excludedTags: [],
              returnTags: false,
              offset: 0,
              limit: 100000,
            },
          }),
          success: function (response) {
            let filterViewData = {
              dtId: event.target.dataset.id,
              filter: filter ? filter.toJSON() : undefined,
              dtVariables: response.results.searchResults,
            };
            this.filterModalView = new datatableFilterModalView({
              model: filterViewData,
              el: $(".modal-body"),
            });
            this.filterModalView.render();
            modal.displayModal(
              this.filterModalView,
              "Dataset : " + searchResult.result.metadata.dataTableName
            );
          }.bind(this),
          error: function (response) {
            console.log(response);
          }.bind(this),
        });
      }
    },
    filterKeypressHandler: function (event) {
      if (
        event.key.toLowerCase() === "enter" ||
        event.key.toLowerCase() === " "
      ) {
        this.filterClickHandler(event);
      }
    },
    databaseClickHandler: function (event) {
      let variableId = _.find($(".modal .fa-filter"), (filterButton) => {
        return filterButton.dataset.target === "variable";
      }).dataset.id;

      let searchResult = _.find(
        tagFilterModel.attributes.searchResults.results.searchResults,
        function (variable) {
          return variable.result.varId === event.target.dataset["id"];
        }
      );
      if (event.target.dataset.target === "datatable") {
        let filter = filterModel.getByVarId(searchResult.result.varId);

        let filterViewData = {
          searchResult: searchResult,
          filter: filter ? filter.toJSON() : undefined,
        };

        if (!_.isEmpty(searchResult.result.values)) {
          this.filterModalView = new categoricalFilterModalView({
            data: filterViewData,
            el: $(".modal-body"),
          });
        } else {
          this.filterModalView = new numericalfilterModalView({
            data: filterViewData,
            el: $(".modal-body"),
          });
        }
        this.filterModalView.render();
        modal.displayModal(
          this.filterModalView,
          searchResult.result.metadata.description
        );
      } else {
        filterModel.updateExportField(searchResult);
        console.log(
          "Current export field count is " + filterModel.getExportFieldCount()
        );
      }
    },
    databaseKeypressHandler: function (event) {
      if (
        event.key.toLowerCase() === "enter" ||
        event.key.toLowerCase() === " "
      ) {
        this.databaseClickHandler(event);
      }
    },
    resolveTagButtonForClick: function (event) {
      let clickIsInsideTagBtn = function (event, tagBtn) {
        let clickXRelativeToTagBtn =
          event.offsetX - (tagBtn.offsetLeft - event.target.offsetLeft);
        return (
          clickXRelativeToTagBtn > 0 &&
          clickXRelativeToTagBtn - tagBtn.offsetWidth < tagBtn.offsetWidth
        );
      };
      let tagBtnClicked;
      _.each($(".hover-control", event.target), (tagBtn) => {
        if (clickIsInsideTagBtn(event, tagBtn)) {
          tagBtnClicked = tagBtn;
        }
      });
      return tagBtnClicked;
    },
    render: function () {
      this.$el.html(this.dataTableInfoTemplate(variableInfoCache[this.varId]));
    },
  });

  return View;
});
