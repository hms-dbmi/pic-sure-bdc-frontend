define([], function() {
    return {
		mappers: {
            categories: {
                path: ['query', 'query', 'query', 'categoryFilters'],
                renderId: "detail-filters",
                render: function(filters = {}){
                    const filtersList = Object.entries(filters);

                    const filterString = filtersList.map(([filter, values]) => {
                        const { category } = /(\\[^\\]+)*\\(?<category>[^\\]+)\\/.exec(filter).groups;
                        return [ "_consents", "_topmed_consents" ].includes(category)
                            ? ''
                            : `<span class="list-title">${category}:</span> Restrict values by ${values.join(", ")}`;
                    }).filter(x => x);

                    return filterString.map(item => `<li>${item}</li>`).join("");
                }
            },
            genomic: {
                path: ['query', 'query', 'query', 'variantInfoFilters'],
                renderId: "detail-filters",
                render: function(filtersList = []){
                    const filterString = filtersList.map(({ categoryVariantInfoFilters = {}, numericVariantInfoFilters = {} }) => {
                        const toString = ([category, values]) => `<div><span class="list-title">${category}:</span> ${values.join(", ")}</div>`;
                        const filters = [
                            Object.entries(categoryVariantInfoFilters).map(toString).join(""),
                            Object.entries(numericVariantInfoFilters).map(toString).join("")
                        ].filter(x => x);
                        return filters.map(item => `<li>${item}</li>`).join("");
                    });

                    return filterString.join("");
                }
            },
            selected: {
                path: ['query', 'query', 'query', 'fields'],
                renderId: "detail-variables",
                render: function(variables = []){
                    const variableList = Object.entries(variables.reduce((map, variable) => {
                        const { path, field } = /(\\(?<path>.+))?\\(?<field>[^\\]+)\\/.exec(variable).groups;
                        if(path){
                            const values = map[path] || [];
                            return { ...map, [path]: [ ...values, field] };
                        } else {
                            return { ...map, [field]: [] };
                        }
                    }, {}));

                    const variableString = variableList.map(([filter, values]) => {
                        const { field } = /([^\\]+\\)*(?<field>[^\\]+)/.exec(filter).groups;
                        return `<span class="list-title">${field}:</span> ${values.join(", ")}`;
                    });

                    return variableString.map(item => `<li>${item}</li>`).join("");
                }
            }
        }
    };
});