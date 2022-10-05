define([
    'backbone',
    'handlebars',
    'text!common/pic-sure-dialog-view.hbs'
], function(BB, HBS, dialog) {
    var PicsureDialog = BB.View.extend({
        initialize: function(opts){
            this.opts = opts;
            this.template = HBS.compile(dialog);
            this.buttonArr = opts.options.map(button => {
                let btnEl = document.createElement('button');
                btnEl.innerText = button.title;
                btnEl.onclick = button.action;
                button.classes && btnEl.classList.add(...button.classes.split(' '));
                btnEl.tabIndex = 0;
                return btnEl;
            });;
        },
        events: {},
        render: function(){
            this.$el.html(this.template(this.opts));
            const optionContainer = this.$el.find('#options');
            this.buttonArr.forEach(button =>{
                optionContainer.append(button);
            });
        }
    });
    return PicsureDialog;
});