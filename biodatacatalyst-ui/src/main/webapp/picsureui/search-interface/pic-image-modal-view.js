define(["jquery", "backbone", "handlebars", "text!search-interface/pic-image-modal-view.hbs", "search-interface/modal",],
function($, BB, HBS, template, modal,) {
    var ImageModalView = BB.View.extend({
        initialize: function(opts){
            this.titles = opts.titles;
            this.images = opts.images;
            this.template = HBS.compile(template);
            this.imageIndex = 0;
            this.currentImage = this.images[this.imageIndex];
        },
        events: {
            'click #next-button': 'next',
            'click #prev-button': 'prev',
        },
        next: function() {
            this.imageIndex++;
            if (this.imageIndex>this.images.length-1) {
                this.imageIndex--; 
                return;
            } 
            this.currentImage = this.images[this.imageIndex];
            this.render();
        },
        prev: function() {
            this.imageIndex--;
            if (this.imageIndex>0) {
                this.imageIndex++; 
                return;
            }
            this.currentImage = this.images[this.imageIndex];
            this.render();
        },
        render: function() {
            this.$el.html(this.template({
                currentImage: this.currentImage,
            }));
            const titles = document.getElementsByClassName('modal-title');
            if (titles && titles.length>0) {titles[0].innerHTML = this.titles[this.imageIndex];}
            this.$el.find('#next-button').attr('disabled', this.imageIndex === this.images.length-1);
            this.$el.find('#prev-button').attr('disabled', this.imageIndex === 0);
        }
    });
    return ImageModalView;
});