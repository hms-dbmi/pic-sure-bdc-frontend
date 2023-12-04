define(["backbone", "handlebars", "underscore", "text!search-interface/data-hierarchy-view.hbs", "text!search-interface/data-hierarchy-view-list.hbs"],
    function (Backbone, HBS, _, template, listTemplate) {

        // Register the Handlebars helper just once, outside of the view definition
        HBS.registerHelper('calcIndent', function (depth, increment) {
            return `${depth * parseFloat(increment)}rem`;
        });

        HBS.registerPartial('hierarchyTemplate', HBS.compile(listTemplate));

        return Backbone.View.extend({
            initialize: function (options) {
                this.dataHierarchy = this.createNestedHierarchy(options.dataHierarchy);
                this.template = HBS.compile(template);
            },
            createNestedHierarchy: function (inputString, depth = 0) {
                const createNode = (name, depth) => ({name, children: []});

                if (typeof inputString !== 'string') {
                    console.error('Expected a string for inputString but received:', inputString);
                    return [];
                }

                let segments = inputString.split('/').map(s => s.trim());
                let root = createNode('root', depth);
                let current = root;

                segments.forEach(segment => {
                    let newNode = createNode(segment);
                    current.children.push(newNode);
                    current = newNode;
                });

                return root.children;
            },
            renderNode: function (node) {
                // Render the current node and its children
                return HBS.partials.hierarchyTemplate(node, {
                    data: {
                        children: node.children.map(child => this.renderNode(child)),
                    }
                });
            },
            render: function () {
                // Start rendering from the root node
                let renderedContent = this.dataHierarchy.map(node => this.renderNode(node)).join('');
                this.$el.html(this.template({hierarchyContent: renderedContent}));

                return this;
            },


        });
});