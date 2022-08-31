define(["jquery", "backbone", "handlebars", "text!search-interface/pic-image-modal-view.hbs", "search-interface/modal",],
function($, BB, HBS, template, modal,) {
    var ImageModalView = BB.View.extend({
        initialize: function(opts){
            this.titles = opts.titles;
            this.images = opts.images;
            this.template = HBS.compile(template);
            this.location = 0;
            this.currentImage = this.images[this.location];
            this.updateButtons();
        },
        events: {
            'click #next-button': 'next',
            'click #prev-button': 'prev',
        },
        next: function() {
            this.location++;
            if (this.location>this.images.length-1) {this.location--; return;} 
            this.currentImage = this.images[this.location];
            this.updateButtons();
            this.render();
        },
        prev: function() {
            this.location--;
            if (this.location>0) {this.location++; return;}
            this.currentImage = this.images[this.location];
            this.updateButtons();
            this.render();
        },
        updateButtons: function() {
            this.disableNext = this.location === this.images.length-1;
            this.disablePrev = this.location === 0;
        },
        render: function() {
            this.$el.html(this.template({
                currentImage: this.currentImage,
            }));
            const titles = document.getElementsByClassName('modal-title');
            if (titles && titles.length>0) {titles[0].innerHTML = this.titles[this.location];}
            this.$el.find('#next-button').attr('disabled', this.disableNext);
            this.$el.find('#prev-button').attr('disabled', this.disablePrev);
        }
    });
    return ImageModalView;
});