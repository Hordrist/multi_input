/**
 * Terminologie : 
    * objet multi_input : une implémentation de la librairie. Il représente toute la logique de la librairie ainsi que sa représentation dans le DOM. Il est instantié
   via la fonction MultiInput, à laquelle on passe une div parente pour la représentation DOM de cet objet, ainsi qu'une variable config pour la configuration de cet objet.
    
    * config : la configuration de la logique d'un l'objet multi_input, permettant par exemple d'activer ou non des fonctionnalités comme le typeahead.
    
    * div parente (multi_input) : l'objet html <div> qui contient le champ et les items d'un objet multi_input. Elle est fournie par le client de la librairie 
en paramètre lors de la création d'un objet multi_input.
    
    * champ (multi_input) / (multi_input) field : l'objet html <input> d'un objet multi_input dans lequel on entre une à une les valeurs souhaitées, qui deviendront des 
items une fois validées. Le champ multi_input est enfant direct de la div parente.
    
    * item (multi_input) / (multi_input) item : une valeur précédemment entrée dans le champ multi_input qui a été validée (en appuyant sur la touche entrée). 
Elles sont représentées dans le dom par des objets <div>. Un objet multi_input peut avoir plusieurs items. Les items peuvent être supprimés.

 * Représentation : La représentation d'un objet multi_input dans le dom est la suivante (schématiquement):
        <div parente>
            <input champ>
            <div items>
            <div items>
            <div items>

 * Configuration : Les différentes variables de configuration de l'outil :
    config:{
        typeahead:{...} //Voir la fonction setTypeahead
    }
*/

/**
 * 
 * @param {any} parent_div La div parente pour le dom de l'objet multi_input
 * @param {any} config La config pour l'objet multi_input
 */
function MultiInput(parent_div, config) {
    
    /** Template d'un objet input_field */
    var field_template = "<input class='input-field'/>";


    parent_div = $(parent_div); //Assurer queparent_div est un objet jquery, et pas un simple objet html
    var field = $(field_template) //Crée un multi_input field à partir d'une template
    parent_div.append(field) //Ajoute le multi_input_field créé à la div multi_input parente

    //Quand on clique entrée pendant la saisie dans le champ multi_input, ça ajoute la valeur de l'input aux items multi_input, et ça vide le champ multi_input
    parent_div.keydown(function eventHandler(event) {
        if (event.code === "Enter") {
            field.typeahead('val', field.typeahead('val').trim())
            if (field.typeahead('val') && !getItemsText().contains(field.typeahead('val'))) {
                parent_div.trigger("validatingFieldValue")
                
            }
        }
    }).on("transformingFieldValueToItem", function (event) {
        event.preventDefault();
        createItem(field.val());
        field.typeahead('val', ""); // Même chose que field.val(""), mais ça met aussi à jour l'état interne de typeahead
        parent_div.trigger("transformedFieldValueToItem")
        console.log(getItemsText())
    })
    /**
     * Permet de créer un item multi_input à partir de la valeur saisie dans le champ multi_input
     * @param {any} text
     */
    function createItem(text) {
        var element = $("<div>");
        var element_text = $("<span>");
        element_text.text(text);
        element_text.addClass("input-item-text")
        var element_delbutton = $("<button>");
        element_delbutton.text("X");
        element_delbutton.click(deleteItem);
        element_delbutton.addClass("input-item-del")
        element.append(element_text);
        element.append(element_delbutton);

        element.addClass("input-item");
        parent_div.append(element)
    }

    /**
     * Permet de supprimer un item multi_input
     * @param {any} event
     */
    function deleteItem(event) {
        $(event.target).closest(".input-item").remove();
    }
    /**@returns {JQuery} */
    function getItems() {
        return parent_div.find(".input-item")
    }

    /**@returns {Array<String>} */
    function getItemsText() {
        return getItems().map(function () {
            return $(this).find(".input-item-text").text()
        }).toArray()
    }
    /**
     * Permet d'ajouter des suggestions pendant l'entrée dans le champ multi_input. Utilise une instance bloodhound.
     * @param {any} tt_config la configuration du typeahead.
     * Structure de tt_config : (parenté par "typeahead:{}" dans la config globale)
        {
            suggestions:{ //Choisir une des options suivantes
                - local: [...] //Un array de suggestions donné en dur
                - prefetch : {...} //Voir la documentation bloodHound : https://github.com/twitter/typeahead.js/blob/master/doc/bloodhound.md#prefetch
                - remote : {...} //Voir la documentation bloodHound : https://github.com/twitter/typeahead.js/blob/master/doc/bloodhound.md#remote
            },

        //Si les suggestions sont des objets, définit le champ à afficher (exemple : display_field : "name" pour des suggestions du type[{name : zorro, age 51},...]).
        Inutile si les suggestions sont des simples listes de string
            display_field : <string>,
            match_needed : <boolean> //Si valeur à true : si la valeur dans le champ multi_input n'appartient pas à la liste de suggestions, on ne peut pas la valider 
            vanilla_options:{...}, //Les options typeahead souhaitées, voir https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md#options
            vanilla_datasets_config:{ //Voir https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md#datasets pour plus d'informations
                async : ...,
                limit : ...,
                templates : ...
            },


        }
     */
    function setTypeahead(tt_config) {
        let tokenizer = !(tt_config.display_field || false) ? Bloodhound.tokenizers.whitespace : Bloodhound.tokenizers.obj.whitespace(tt_config.display_field)
        let sugg = new Bloodhound({
            datumTokenizer: tokenizer,
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            //identify: function (obj) {return obj.id },
            ...tt_config.suggestions
        });
        //Pb actuellement : récupérer le lookup (l'id ici) de la suggestion (piste : event "typeahead:selected") et l'enregistrer, puis le validé si enter et 
        //le suppr si input
        field.typeahead(tt_config.vanilla_options,
            {
                name: "suggestions",
                source: sugg,
                display: function (obj) { return obj.id+";"+obj.libelle},
                ...tt_config.vanilla_datasets_config 
            }
        )
        if (tt_config.match_needed === true) {
            parent_div.on("validatingFieldValue", function () {
                let valid = false
                let search_results = [];
                sugg.search(field.val(), (datums) => { search_results.push(datums) }, (datums) => { search_results.push(datums) })
                search_results.forEach((result) => {
                    if (result == field.val()) {
                        valid = true;
                    }
                })
                if (!valid) {
                    alert("Pour être valide, la valeur du champ doit être proposée dans les suggestions");
                    field.trigger("fieldValueInvalidated")
                }
                else {
                    parent_div.trigger("fieldValueValidated")
                    parent_div.trigger("transformingFieldValueToItem")
                }

            });
        }
    }

    if (config?.typeahead) {
        setTypeahead(config.typeahead)
    }


}

Array.prototype.contains = function (value) {
    for (let i = 0; i < this.length; i++) {
        if (this[i] === value)
            return true;
    }
    return false;
}
