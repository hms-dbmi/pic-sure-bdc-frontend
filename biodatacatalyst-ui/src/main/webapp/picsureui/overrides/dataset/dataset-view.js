define(["dataset/utilities"], function(dataUtils) {
    return {
        mappers: function(map){
            return {
                ...map,
                categories: {
                    path: ['query', 'categoryFilters'],
                    renderId: "detail-filters",
                    render: function(filtersList = {}){
                        let data = dataUtils.format.categories(filtersList);
                        data = data.filter(({ title }) => ![ "_consents", "_topmed_consents" ].includes(title));
                        return dataUtils.render.html(data, "Restrict values by ")
                            .map(item => `<li>${item}</li>`).join('');
                    }
                }
            };
        }
    };
});