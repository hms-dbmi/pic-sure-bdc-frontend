define([
    'backbone',
    'handlebars',
    'text!common/pic-sure-dialog-view.hbs',
    'search-interface/modal'
], function(BB, HBS, dialog, modal) {
    var PicsureDialog = BB.View.extend({
        initialize: function(opts){
            this.opts = opts;
            this.modalId = (opts.modalContainerId ? opts.modalContainerId : "modal-window");
            this.template = HBS.compile(dialog);
            this.buttonArr = opts.options.map(button => {
                let btnEl = document.createElement('button');
                btnEl.innerText = button.title;
                btnEl.onclick = button.action;
                button.classes && btnEl.classList.add(...button.classes.split(' '));
                btnEl.tabIndex = 0;
                return btnEl;
            });
            this.previousView = opts.previousView;
        },
        onClose: function() {
            this.previousView && modal.displayModal(this.previousView.view, this.previousView.title);
        },
        render: function(){
            this.$el.html(this.template(this.opts));
            const optionContainer = this.$el.find('#options');
            this.buttonArr.forEach(button => {
                optionContainer.append(button);
            });
            let close = $('#' + this.modalId + ' .close');
            this.previousView && close?.off('click');
            this.previousView && close?.on('click', this.onClose.bind(this));
        }
    });
    return PicsureDialog;
});