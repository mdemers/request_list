(function(exports) {

    function RequestList(item_limit) {
	this.item_limit = item_limit;
	this.setUpList();
    };

    RequestList.prototype.cookie = function(cookie_name, value) {
	if (!value) {
	    return $.cookie('as_pui_request_list_' + cookie_name, { path: '/' });
	}

	var args = Array.prototype.slice.call(arguments, 0);
	args[0] = 'as_pui_request_list_' + args[0];
	args.push({ path: '/' });
	return $.cookie.apply(this, args);
    };

    RequestList.prototype.getList = function() {
	return JSON.parse(this.cookie("list_contents"));
    };

    RequestList.prototype.setList = function(list) {
	this.cookie("list_contents", JSON.stringify(list));
    };

    RequestList.prototype.isInList = function(uri) {
	var list = this.getList();
	return !($.inArray(uri, list) == -1);
    };

    RequestList.prototype.updateButtonState = function() {
	var rl = this;
	$(".request_list_action_button").each(function(ix) {
	    var button = $(this);
	    if (rl.isInList(button.data("uri"))) {
		var i = button.find("i." + button.data("add-icon"));
		if (i) {
		    i.removeClass(button.data("add-icon"));
		    i.addClass(button.data("remove-icon"));
		    button.attr("title", button.data("remove-label"));
		    button.html(button.html().replace(button.data("add-label"), button.data("remove-label")));
		}
	    } else {
		var i = button.find("i." + button.data("remove-icon"));
		if (i) {
		    i.removeClass(button.data("remove-icon"));
		    i.addClass(button.data("add-icon"));
		    button.attr("title", button.data("add-label"));
		    button.html(button.html().replace(button.data("remove-label"), button.data("add-label")));
		}
	    }
	});
    };

    RequestList.prototype.toggleItemExpand = function(item) {
	var item_form = $(item).children('.rl-item-form')
	if (item_form.is(':visible')) {
	    item_form.slideUp(function() {
	        $(this).parent().find('.rl-expand-item-button').find('i')
		       .removeClass('fa-angle-up').addClass('fa-angle-down');
	    });
	    $(item).css('background', '');
	} else {
	    $(item).css('background', '#f2f2f2');
	    item_form.slideDown(function() {
		var expandButton = $(this).parent().find('.rl-expand-item-button');
	        expandButton.find('i').removeClass('fa-angle-down').addClass('fa-angle-up');
		expandButton.show();
	    });
	}
    };

    RequestList.prototype.originalListOrder = function(reverse) {
	var $list = $('.rl-list');
	var $items = $list.children('.rl-list-item');
	$items.detach();

	this.getList().forEach(function(u) {
	    $list.append($items.filter('div[data-uri=' + CSS.escape(u) + ']'));
	});
    };

    RequestList.prototype._sortList = function(field, reverse) {
	var $list = $('.rl-list');
	var $items = $list.children('.rl-list-item');

	$items.sort(function(a, b) {
		var ia = $(reverse ? b : a).data('sort-' + field).toLowerCase();
		var ib = $(reverse ? a : b).data('sort-' + field).toLowerCase();
		if (ia < ib) { return -1 }
		if (ia > ib) { return 1 }
		return 0;
	    });

	$items.detach().appendTo($list);
    };

    RequestList.prototype.sortList = function(field) {
	this._sortList(field, false);
    };

    RequestList.prototype.reverseSortList = function(field) {
	this._sortList(field, true);
    };

    RequestList.prototype.sortStates = function() {
	return {
	    'fa-sort': 'fa-sort-down', 
	    'fa-sort-down': 'fa-sort-up', 
	    'fa-sort-up': 'fa-sort', 
	};
    };

    RequestList.prototype.sortButtonClick = function(button, field) {
	var icon = $(button).children('i');
	var allButtonIcons = $('.rl-sort-button').children('i');
	var states = this.sortStates();
	var nextState = states[icon.attr('class').match(/(fa-sort[^ ]*)/)[1]];
	for (k in states) { allButtonIcons.removeClass(states[k]); }
	allButtonIcons.addClass('fa-sort');
	icon.removeClass('fa-sort');
	icon.addClass(nextState);

	icon.parent().parent().children('.rl-sort-button').css('background', '');
	icon.parent().parent().children('.rl-sort-button').each(function(ix, but) { $(but).attr('title', $(but).attr('data-title')) });
	$('.rl-sort-button').css('font-weight', 'normal');
	$('.rl-display').css('background', '');
	if (icon.hasClass('fa-sort')) {
	    this.originalListOrder();
	} else if (icon.hasClass('fa-sort-down')) {
	    this.sortList(field);
	    icon.parent().css('background', '#f2f2f2');
	    $(button).attr('title', 'Sorted A-Z')
	    $(button).css('font-weight', 'bold');
            $('.rl-display-' + $(button).data('key')).css('background', '#f2f2f2');
	} else {
	    this.reverseSortList(field);
	    icon.parent().css('background', '#f2f2f2');
	    $(button).attr('title', 'Sorted Z-A')
	    $(button).css('font-weight', 'bold');
            $('.rl-display-' + $(button).data('key')).css('background', '#f2f2f2');
	}
    };

    RequestList.prototype._setAllItems = function(value) {
	$('.rl-item-check').prop('checked', value);
    };

    RequestList.prototype.selectAllButtonClick = function() {
	this._setAllItems(true);
    };

    RequestList.prototype.selectNoneButtonClick = function() {
	this._setAllItems(false);
    };

    RequestList.prototype.showAlertModal = function(message, callback) {
        if (callback) {
	  $('#rl-alert-modal').find('.action-btn').click(function() { callback(); $("#rl-alert-modal").modal('hide')});
          $('#rl-alert-modal').find('.action-btn').show();
	} else {
          $('#rl-alert-modal').find('.action-btn').hide();
	}

	$("#rl-alert-message").html(message);
	$("#rl-alert-modal").modal('show');
    };

    RequestList.prototype.submitButtonClick = function(handlerId) {
	var self = this;
	var startListLength = self.getList().length;
	var handler = $('#rl-handler-' + handlerId);
	var checkedItems = handler.find('.rl-list').children('.rl-list-item').has('.rl-item-check:checked');


	// Don't allow submission of an empty list
	if (checkedItems.length == 0) {
	    self.showAlertModal(HARVARD_AEON_MESSAGES['empty_list_error_message']);
	    return false;
	}


	// Don't allow items that are excluded from this request type
	var rt = $("#request_type_select").children('option:selected').text();
	var excludedItems = checkedItems.has('.rl-ha-excluded-request-types > data[value="' + rt + '"]');
	var msg = "";
	if (excludedItems.length > 0) {
	    while (excludedItems.length > 0) {
		var repo = $(excludedItems[0]).data('repo');
		var excludedForRepo = $(excludedItems).filter('[data-repo="' + repo + '"]');

		msg += '<p>' + EXCLUDED_MESSAGE[rt][repo] + "</p><ul>";

		excludedForRepo.each(function(ix, ei) {
			msg += '<li>' + $(ei).find('.rl-item-count-label').text() + ': ' + $(ei).find('.rl-display-title').text().trim()  + "</li>";
			    });
		msg += '</ul>';

		excludedItems = jQuery.grep(excludedItems, function(item) {
			return $(item).data('repo') != repo;
		    });

		msg += "\n";
	    }
	    self.showAlertModal(msg);
	    return false;
	}


	// Don't allow submission if required fields are unfilled
	var unfilled_fields = $('.rl-ha-additional-fields').find('.rl-ha-list-input:visible')
	                                                   .filter('.required')
                                                           .filter(function() { return $(this).val() == ""; });
	if (unfilled_fields.length > 0) {
	    var msg = '<p>' + HARVARD_AEON_MESSAGES['unfilled_fields_error_message'] + "</p><ul>";
            unfilled_fields.each(function(ix, uf) { msg += '<li>' + $(uf).closest('.form-group').children('label').text() + "</li>"; });
            msg += '</ul>';
	    self.showAlertModal(msg);
	    unfilled_fields.css('border', '2px solid #faa');
	    return false;
	}


	// tidy up unneeded fields before submission
	// Note that this assumes the page will be reloaded
	$('.rl-ha-additional-fields').find('.rl-ha-list-input:hidden').remove();
	handler.find('.rl-item-check:not(:checked)').each(function(ix, chk) {
	    $(chk).parents('.rl-list-item').find('.rl-item-form').remove();
	});


	/*
	  Group by consecutive component_id
	  This is quite curly. It goes like this:

	  The goal is to set a hidden input with name=gid_req# on items from HOU that have no gid but have 'consecutive component_ids'
	  Assumptions:
	      - we're looking for consecutive ids within a collection
              - any length run of consecutive ids can be grouped
              - 'consecutive ids' is actually determined by looking at the last number in the id
	          HOU ids have many forms, but mostly they are '(###)', where ### is the number we're interested in

	   So we use this regex: rx = /^(.*?)(\d+)(\D*)$/;
	   Then after matching, the match array has our number at index 2
	   Like this:
	       var m = rx.exec(component_id);
	       m[2]; // our number for testing consecutive runs

	   So, we go through HOU items without a gid building up a hash like this:
	       { CallNumber + m[1] + m[3]: { m[2]: rl-list-item, ... } }

	   Then, each of the values in our hash is a hash keyed on our number
	   So we go through that inner hash in numerically sorted key order
	   And if the current number is one more than the last number
             then add this number to an array of (grp)
	   When the sequence is broken (or at the end)
             make the group by setting a gid on the rl-list-items pointed to by the numbers in our grp array
             then clear the array
	*/

	var groups = {};
        var groupKeys = {};
	var rx = /^(.*?)(\d+)(\D*)$/;
	$('.rl-item-form:not(:has(input[name^=gid_]))').has('input[name^=ItemIssue_]').has('input[name^=Location_][value=HOU]').each(function(ix, rif) {
	    var m = rx.exec($(rif).find('input[name^=ItemIssue_]').attr('value'));
	    var k = $(rif).find('input[name^=CallNumber_]').attr('value') + m[1] + m[3];
	    if (!groups.hasOwnProperty(k)) { groups[k] = {}; groupKeys[k] = []; }
	    groupKeys[k].push(parseInt(m[2]));
	    groups[k][parseInt(m[2])] = rif;
	});

	$.each(groups, function(k, collection) {
	    var last_id = false;
	    var grp = []
	    $(groupKeys[k].sort(function(a,b) { return a - b })).each(function(ix, id) {
		if (last_id && id == last_id + 1) {
		    if ($.inArray(last_id, grp) == -1) { grp.push(last_id) }
		    grp.push(id);
		} else if (grp.length > 0) {
		    $(grp).each(function(ix, id) {
			var request_number = $(collection[id]).children('input[name=Request]').attr('value');
			$(collection[id]).append('<input type="hidden" name="gid_' + request_number + '" value="' + k + grp[0] + '"/>');
		    });
		    grp = [];
		}
		last_id = id;
	    });

	    if (grp.length > 0) {
	        $(grp).each(function(ix, id) {
		    var request_number = $(collection[id]).children('input[name=Request]').attr('value');
		    $(collection[id]).append('<input type="hidden" name="gid_' + request_number + '" value="' + k + grp[0] + '"/>');
		});
	    }
	});


	// Sort items by ItemIssue before submiting
	var $list = handler.find('.rl-list');
	var $items = $list.children('.rl-list-item');
	$items.sort(function(a, b) {
		var ia = $(a).find('input[name^=ItemIssue_]').attr('value');
		var ib = $(b).find('input[name^=ItemIssue_]').attr('value');
		// sort on the last numeric component
		var ma = rx.exec(ia);
		var mb = rx.exec(ib);
		if (ma && mb) {
		    ia = parseInt(ma[2]);
		    ib = parseInt(mb[2]);
		}
		if (ia < ib) { return -1 }
		if (ia > ib) { return 1 }
		return 0;
	    });
	$items.detach().appendTo($list);


        setTimeout(function() {
	    $('#rl-handler-' + handlerId).find('.rl-list').children('.rl-list-item').has('.rl-item-check:checked').each(function(ix, rli) {
                self.removeFromList($(rli).data('uri'), true);
                self.removeFromForm($(rli));
	    });
            self.setUpList();

	    var itemsSent = startListLength - self.getList().length;

	    if (itemsSent > 0) {
		// strip off the querystring
		var new_location = location.href.replace(location.search, '');
		new_location += '?sent=' + itemsSent;
	        // seems we need to cover 2 cases here - whether the submit button's target tab is open yet ... sigh
	        setTimeout(function() { location.replace(new_location); }, 1000);
	        location.replace(new_location);
	    }
	}, 100);

	handler.find('.rl-form').submit();

	return true;
    };


    RequestList.prototype.emailListButtonClick = function(buttonLabel) {
	this.showEmailModal();
	var $modal = $('#rl-email-modal');
	$modal.find('div.modal-body').attr('id', 'requestThis');
	var $btn = $modal.find('.action-btn');
	$btn.html(buttonLabel);
	$btn.click(function(e) {
		$("#rl-email-list-form").submit();
	    });
    };


    RequestList.prototype.showEmailModal = function() {
	$("#rl-email-modal").modal('show');

	$('#user_name',this).closest('.form-group').removeClass('has-error');
	$('#user_email',this).closest('.form-group').removeClass('has-error');

	$('#rl-email-list-form', '#rl-email-modal').on('submit', function() {
		var proceed = true;

		if ($('#user_email',this).val().trim() == '') {
		    $('#user_email',this).closest('.form-group').addClass('has-error');
		    proceed = false;
		} else {
		    $('#user_email',this).closest('.form-group').removeClass('has-error');
		}

		return proceed;
	    });
    };

    RequestList.prototype.removeAllButtonClick = function(msg) {
	this.showAlertModal(msg, function() {
		request_list.removeAll();
	    });
    };

    RequestList.prototype.removeAll = function() {
	this.setList([]);
	location.reload(true);
    };

    RequestList.prototype.removeFromListButtonClick = function(button) {
	this.removeFromList($(button).data('uri'));
	this.removeFromForm($(button).parents('.rl-list-item'));
    };

    RequestList.prototype.removeFromForm = function(item) {
	item.slideUp('normal', function() {$(this).remove()});
    };

    RequestList.prototype.showListCount = function(flash) {
	var items = this.getList().length;
	var a = $("a[href$='/plugin/request_list/list']").first();
	a.html(a.html().replace(/ \(\d+\)/, " (" + items + ")"));
	if (flash) {
	    a.parent().fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
	}
	if (items >= this.item_limit) {
	    a.parent().addClass('request-list-full');
	} else {
	    a.parent().removeClass('request-list-full');
	}
    };

    RequestList.prototype.addToList = function(uri) {
	var list = this.getList();
	if (list.length >= this.item_limit) {
  	    this.showAlertModal(HARVARD_AEON_MESSAGES['full_list_error_message']);
	    return;
	}
	if (this.isInList(uri)) {
	    return false;
	} else {
	    list.push(uri);
	    this.setList(list);
	    this.showListCount(true);
	    return true;
	}
    };

    RequestList.prototype.removeFromList = function(uri, silent) {
	var list = this.getList();
	if (this.isInList(uri)) {
	    list.splice($.inArray(uri, list), 1);
	    this.setList(list);
	    this.showListCount(!silent);
            this.showRemoveAllButton();
	    if (list.length == 0) {
		location.reload(true);
	    }
	    return true;
	} else {
	    return false;
	}
    };

    RequestList.prototype.toggleListItem = function(uri) {
	if (this.isInList(uri)) {
	    this.removeFromList(uri);
	} else {
	    this.addToList(uri);
	}
	this.updateButtonState();
    };

    RequestList.prototype.showRemoveAllButton = function() {
	if (this.getList().length > 0) {
            $('.rl-remove-all').show();
        } else {
            $('.rl-remove-all').hide();
	}
    };

    RequestList.prototype.setUpList = function() {
	if (!this.cookie("list_contents")) {
	    this.setList([]);
	}
	    
	this.updateButtonState();
	this.showListCount();
        this.showRemoveAllButton();
    };

    exports.RequestList = RequestList;

}(window));

// Make sure the list is set up when arriving from a back button click
window.onpageshow = function(event) {
  if (typeof window.request_list !== 'undefined') {
      window.request_list.setUpList();
  }
}

$(function() {
    $('.rl-list-item').hover(
        function() {
	    $(this).find('.rl-expand-item-button').show();
	    return true;
	},
	function() {
	    var itemForm = $(this).find('.rl-item-form');
	    if (itemForm.is(':hidden') || itemForm.is(':animated')) {
		$(this).find('.rl-expand-item-button').hide();
	    }
            return true;
	}
    );

    if (!SHOW_BUILTIN_REQUEST_BUTTON_FOR_HANDLED_REPOSITORIES && $('meta[name=rl-handler-defined]').length) {
        $('#request_sub').parent().hide();
    }
});
