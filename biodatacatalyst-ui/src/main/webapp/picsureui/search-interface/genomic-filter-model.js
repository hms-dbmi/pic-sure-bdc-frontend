define(["backbone", "handlebars"],
    function(BB, HBS){

        let GenomicFilterModel = BB.Model.extend({
            defaults:{
                genes: new BB.Collection,
                consequences: new BB.Collection,
                severity: new BB.Collection,
                variantClass: new BB.Collection,
                variantFrequencyText: new BB.Collection,
                variantFrequencyNumber: new BB.Collection
            },
            initialize: function(){
                console.log("GenomicFilterModel.initialize()");
                this.set('genes', new BB.Collection);
                this.set('consequences', new BB.Collection);
                this.set('severity', new BB.Collection);
                this.set('variantClass', new BB.Collection);
                this.set('variantFrequencyText', new BB.Collection);
                this.set('variantFrequencyNumber', new BB.Collection);
            },
            addGeneFilter: function(newGene) {
                this.get('genes').add(newGene);
            },
            removeGeneFilter: function(gene) {
                this.get('genes').remove(gene);
            }
        });

        return new GenomicFilterModel();
    });