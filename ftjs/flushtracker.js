/**
 flushtracker.js
 Author: Dik Langan
 Url: https://github.com/fixitdik/flushtracker

 Dependencies: jQuery

 flushtracker.js is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 flushtracker.js is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with flushtracker.js.  If not, see <http://www.gnu.org/licenses/>.
 **/

var FlushTracker;

jQuery(function($) {

    //instantiate object
    FlushTracker= function () {

        // make sure there's only one
        if (!(this instanceof FlushTracker)) {
            throw new fcObj.Exception('Attempt to create more than one instance of FlushTracker object');
        }

        // set up some variables used throughout
        var fcObj = this;
        fcObj.hist = [];

        // initialise the object
        this.init = function (elementName) {
            if (elementName === undefined) {
                elementName = 'flushtracker';
            }
            fcDiv = $('#' + elementName);
            if (!fcDiv.length || fcDiv[0].tagName != 'DIV') {
                throw new fcObj.Exception('\'' + elementName + '\' element not defined as DIV in HTML');
            }
            fcDiv.addClass('flushtracker');
            fcObj.initHandlers(fcDiv);
            fcDiv.html('').append(fcObj.getTemplate('tableaux'));
            fcObj.readHist();
            fcObj.showHistory();
        };


        // initialise all the event handlers we need
        this.initHandlers = function (fcDiv) {

            // first the four buttons
            fcDiv.on('click', '#New', fcObj.addNew);

            fcDiv.on('click', '#ftOptions', fcObj.showMenu);
        };

        ///
        // Now the functions to support the above actions
        ///
        
        this.addNew = function () {
        
            //@@ need to prepare drop down lists
            var today = JSON.parse(JSON.stringify(new Date()));
            var yesterday = new Date();
            yesterday = JSON.parse(JSON.stringify(new Date(new Date().setDate(new Date().getDate() - 1))));
            var tmp = fcObj.getTemplate('addDropDownOption');
                         
            var datesList = tmp.replace('%value%',yesterday.substring(0, 10)).replace('%display%','yesterday (' + yesterday.substring(0, 10) + ')');
            datesList += tmp.replace('%value%',today.substring(0, 10)).replace('%display%','today (' + today.substring(0, 10) + ')');
            var timesList = '';
            for (var i = 0; i < 24; i++) {
                timesList += tmp.replace('%value%',fcObj.pad(i,2) + ':00').replace('%display%', fcObj.pad(i,2) + ':00');
            }
            timesList += tmp.replace('%value%',today.substring(11, 16)).replace('%display%','now (' + today.substring(11, 16) + ')');
            
            $('<div>' + fcObj.getTemplate('addPopup')
                .replace('%dates%', datesList) 
                .replace('%times%', timesList) + 
                '</div>').dialog(
                {
                    modal : true, 
                    title :  'New one happened',
                    dialogClass : 'ftMenu',
                    buttons : [
                        {
                            text : 'Now',
                            click : function () {
                                fcObj.hist.splice(0, 0, { 
                                                        date: today.substring(0, 10),
                                                        time: today.substring(11, 16)
                                                        });
                                fcObj.saveHist();
                                fcObj.showHistory();
                                $(this).dialog('destroy');
                            }
                        },
                        {
                            text : 'As above',
                            click : function () {
                                fcObj.hist.splice(0, 0, { 
                                                        date: $('#ftDate').val(),
                                                        time: $('#ftTime').val()
                                                        });
                                fcObj.saveHist();
                                fcObj.showHistory();
                                $(this).dialog('destroy');
                            },
                            class : 'default-button'
                        },
                        {
                            text : 'close', 
                            click : function () {
                                $(this).dialog('destroy');
                            }
                        }
                    ],
                    close : function () {
                        $(this).dialog('destroy');
                    }
                });
        
        
        };
        
        this.menu = function () {
        };
        
        this.showHistory = function () {
            var tmp = '';
            for (var index = 0; index < fcObj.hist.length; index++) {
                var tmp2 = fcObj.getTemplate('historyline');
                tmp += tmp2.replace('%date%', fcObj.hist[index].date)
                    .replace('%time%', fcObj.hist[index].time);
            };
            $('#ftHistory').html((fcObj.getTemplate('history')).replace('%history%', tmp));
        };


        // save history to localStorage (if supported)
        this.saveHist= function () {
            if (fcObj.usingstorage) {
                try {
                    localStorage.setItem('flushTrackerHistory', JSON.stringify(fcObj.hist));
                } catch (ex) {
                    // just catch
                }
            }
        };


        // read the game from localStorage (if supported)
        // returns true if previous history exists
        this.readHist= function () {
            if (typeof(Storage) !== "undefined" && localStorage !== undefined) {
                fcObj.usingstorage = true;
                fcObj.hist = fcObj.readStorage(localStorage.flushTrackerHistory, 'array');
                if (fcObj.hist.length == 0) {
                    fcObj.hist = fcObj.readStorage(localStorage.flushCounterHistory, 'array');
                }
                return (fcObj.hist.length > 0);
            } else if (!(document.cookie.indexOf('nostorage') > -1)) {
                document.cookie = 'nostorage=true';
                fcObj.alert('Your browser does not support "localStorage" so there is no way to remember history, sorry');
            }
            fcObj.usingstorage = false;
            return false;
        };


        // parse localStorage item without error
        this.readStorage = function (item, type) {
            try {
                return JSON.parse(item);
            } catch (ex) {
                if (type == 'array') {
                    return [];
                } else if (type == 'number') {
                    return 0;
                } else {
                    return '';
                }
            }
        };

        // reset the remembered high scores
        this.resetHistory= function (newName) {
            fcObj.hist = [];
            try {
                localStorage.removeItem('flushTrackerHistory');
            } catch (ex) {}
        };



        //replace window alert with jQuery dialog
        this.alert = function (someHTML) {
            $('<div>' + someHTML +'</div>').dialog({
                modal : true, 
                title : "Flush Tracker", 
                close : function () {
                    $(this).dialog('destroy');
                }
            });
        };


        // replace window confirm with jQuery dialog
        this.confirm = function (question, confirmFunction) {
            $('<div>' + question + '</div>').dialog({
                title : 'Are you sure?',
                close : function () {
                    $(this).dialog('destroy');
                },
                buttons : {
                    "Confirm" : function () {
                        $(this).dialog('destroy');
                        confirmFunction();
                    },
                    "Cancel" : function () {
                        $(this).dialog('destroy');
                    }
                }
            });
        };


        // custom exception to give notice to user
        this.Exception = function(message) {
            fcObj.alert(message);
            this.message = message;
            this.name = "Fatal error";
        };

        // return string n padded to length w using optional char z (default is '0')
        this.pad = function(n, w, z) {
          z = z || '0';
          n = n + '';
          return n.length >= w ? n : new Array(w - n.length + 1).join(z) + n;
        }

        // return appropriate HTML template for elements
        this.getTemplate = function (templateName) {
            var templates = {
                'tableaux' :
                    '<div id="workspace">' +
                        '<form name="ButtonsForm">' +
                            '<h1>Flush Tracker</h1>' +
                            '<input type="button" id="New" value="New" class="ui-button ui-corner-all">' +
                            '<span id="ftHistory"/>' +
                            '<!--span id="ftOptions">Options</span-->' +
                        '</form>' +
                    '</div>',
                'history' :
                    '<table class="ftHistory"><tr><th>Date</th><th>Time</th></tr>%history%</table></div>',
                'historyline' :
                    '<tr class="%highlight%"><td>%date%</td><td>%time%</td></tr>',
                'optionsMenu' :
                    '<div class="ftMenu"><h1>Options</h1>' +
                    '<label for="ftColor">Colour:&nbsp;</label><input type="text" id="ftColour">' +
                    '</div>',
                'addPopup' :
                    '<div class="ftPopup">' +
                    '<label for="ftDate">Date:&nbsp;</label><select id="ftDate">' +
                    '%dates%' +
                    '</select>' +
                    '<br>' +
                    '<label for="ftTime">Time:&nbsp;</label><select id="ftTime">' +
                    '%times%' +
                    '</select></div>',
                'addDropDownOption' :
                    '<option selected value="%value%">%display%</option>'
            };
            return templates[templateName];
        };
    };
});