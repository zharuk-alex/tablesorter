function editable_table(TABLE_SETTINGS){
  if (typeof TABLE_SETTINGS == 'undefined' || TABLE_SETTINGS == null) {
    console.error('TABLE_SETTINGS NOT exist');
    return false;
  }

  var t_data_storage={}; // VARIABLE for save ajax data request
  var order_req={}; // VARIABLE for save priority order
  var newItemData={}; // VARIABLE for create new item

  $(function() {
    // ///////////////////
    // Bootstrap theme Tablesorter
    $.tablesorter.themes.bootstrap = {
      // these classes are added to the table. To see other table classes available,
      // look here: http://getbootstrap.com/css/#tables
      table        : 'table table-bordered table-striped',
      caption      : 'caption',
      // header class names
      header       : 'bootstrap-header', // give the header a gradient background (theme.bootstrap_2.css)
      sortNone     : '',
      sortAsc      : '',
      sortDesc     : '',
      active       : '', // applied when column is sorted
      hover        : '', // custom css required - a defined bootstrap style may not override other classes
      // icon class names
      icons        : '', // add "bootstrap-icon-white" to make them white; this icon class is added to the <i> in the header
      iconSortNone : 'bootstrap-icon-unsorted', // class name added to icon when column is not sorted
      iconSortAsc  : 'glyphicon glyphicon-chevron-up', // class name added to icon when column has ascending sort
      iconSortDesc : 'glyphicon glyphicon-chevron-down', // class name added to icon when column has descending sort
      filterRow    : '', // filter row class; use widgetOptions.filter_cssFilter for the input/select element
      footerRow    : '',
      footerCells  : '',
      even         : '', // even row zebra striping
      odd          : ''  // odd row zebra striping
    };

    var table = $('#'+TABLE_SETTINGS.t_id).tablesorter({
      theme: "bootstrap",
      widgets : Object.values(TABLE_SETTINGS.tablesorter_widgets),
      headerTemplate : '{content} {icon}',
      initialized: function(table) {
        // Enable dragndrop
        enableSortDragNDrop(this);
        //
        $(table).find('tbody tr').each(function() {
          var rowUniq = $(this).data('row-uniq');
          // orderAction(order, table);
          order_req[rowUniq]={'oldData':$(this).index()};
        });
        $(table).on('sortStart', function() {
        });
      },
      // sortList: [[0,0]], // init sort column on table init
      //  OPTIONS
      widgetOptions: {
        zebra : ["even", "odd"],
       // class names added to columns when sorted
       // columns: [ "primary", "secondary", "tertiary" ],
       columns: [ "", "", "" ],

       // reset filters button
       filter_reset : ".reset",

       // extra css class name (string or array) added to the filter element (input or select)
        filter_cssFilter: "form-control",
          //Build Table
        build_type   : 'json',
        build_source : {
         url: TABLE_SETTINGS.request_urls.read,
         dataType: 'json',
         method:'GET',
         data:{
           action:TABLE_SETTINGS.action.read
         }
       },
       build_processing : function(data, wo) {
         // t_data_storage['header'] = data['headers'];
         newItemData = data['headers'][0].map(function(cell, index){
           return (cell.hasOwnProperty('settings')) ? Object.assign(cell.settings, {label: cell.text, td_id: index}) : false;
         });
         console.log(newItemData);
         return data;
       }
      }
    })
  });

  // buildModalForm
  function buildModalForm(par) {
    // create form
    var $form = $('<form>');

    $form.on('input select change','input, select',function(){
      $(this).closest('.modal').find('.btn').removeClass('disabled').prop('disabled', false);
    });

    if(par.action == "edit"){
      var parent_ = $(par.context).closest('tr');
      var row_data = parent_.data();
      parent_.children().each(function(index){
        var td_data = $(this).data();
        if($(this).data('edit-type')){
          var input_data = Object.assign(row_data, td_data, {
            label : $($("#"+TABLE_SETTINGS.t_id+' th').get(index)).text(),
            innerValue : $(this).html(),
            td_id : index,
          });
          $form.append(switchEditType(input_data));
        }
      })
    }else if (par.action == "new") {
      newItemData.map(function(cell){
        if(cell.hasOwnProperty('data-edit-type')){
          // console.log(cell);
          var input_data = {
            label : cell.label,
            inputName: cell["data-input-name"],
            td_id : cell.td_id,
            editType : cell["data-edit-type"]
          };
          $form.append(switchEditType(input_data));
        }
      })
    }
    return $form;
  }
  // END buildModalForm
  // Make modal draggable
  $(document).on('shown.bs.modal', '.modal', function(e) {
    $(this).find('.modal-dialog').draggable({
        handle: ".modal-header"
    });
    $(this).attr('id','myModal');
  })
  // END Make modal draggable
  // ADD NEW ROW
  $('#btn-newItem').on('click',function(e){
    console.log(e)
    var dialogAdd = bootbox.dialog({
      title: MODAL_MESSAGES['modal'].add['title'],
      message: buildModalForm({
        context:$(this),
        action: "new"
      }),
      buttons:{
        confirm: {
            className: 'btn-success disabled',
            callback: function(){
              // append new data to table cells
              var $modal = $(this);
              var $form = $modal.find('form');

              // make ajax request for data update
              $form.children('.form-group').each(function(){
                var cell_num = $(this).data('cell-num');
                var input = $(this).find('input, select');
                var cell_val="empty";
                // console.log(new Date(input.val()).toISOString().slice(0, -1));
                if(input.data('edit-type')=="text"){
                  cell_val = input.val();
                }else if(input.data('edit-type')=="select2" || input.data('edit-type')=="select"){
                  cell_val = input.find('option:selected').text();
                }else if(input.data('edit-type') == "date"){
                  // console.log(input);
                  cell_val = input.val();
                }else{
                  // return false;
                }
              });

              // END append new data to table cells
              var req_param = $.param({
                action:TABLE_SETTINGS['action']['insert'], // update data
              })+"&"+$form.serialize();
              //
              // make ajax request for data insert
              $.ajax({
                method: "POST",
                url: TABLE_SETTINGS.request_urls['insert'],
                data: req_param,
                dataType:"json",
                success: function(insert_resp){
                  if(insert_resp['req_status'] == 200){
                    // END append new data to table cells
                    var row = $('<tr>').attr('data-row-uniq', insert_resp.row['data-row-uniq'])
                    insert_resp['row'].cells.map(function(td){
                      $('<td>',td).appendTo(row)
                    })
                    $("#"+TABLE_SETTINGS['t_id']).find('table tbody').append(row).trigger('addRows');
                    $modal.modal('hide');
                    notifyMessanger(MODAL_MESSAGES['notify'].success_update, 'success')
                  }
                }
              })
              return false;
            }
        },
        cancel: {
          className: 'btn-danger disabled'
        },
      },
    })
  })
  // END ADD NEW ROW
  // EDIT DATA
  $(document).on('click', '.edit', function(e) {
    var btn = $(this);
    var dialogEdit = bootbox.dialog({
      title: MODAL_MESSAGES['modal'].edit['title']+$(this).closest('tr').data('row-uniq'),
      message: buildModalForm({
        context:$(this),
        action: "edit"
      }),
      buttons:{
        confirm: {
            className: 'btn-success disabled',
            callback: function(){
              var $modal = this;
              // append new data to table cells
              var $form = $(this).find('form');
              var row = btn.closest('tr');
              var rowUniq = row.data('rowUniq');

              var req_param = $.param({
                action:TABLE_SETTINGS['action']['update_data'], // update data
                rowUniq:rowUniq
              })+"&"+$form.serialize();
              //
              // make ajax request for data update
              $.ajax({
                method: "POST",
                url: TABLE_SETTINGS.request_urls['update'],
                data: req_param,
                dataType:"json",
                success: function(update_resp){
                  if(update_resp['req_status'] == 200){
                    var updated_row = $(row).children();
                    $form.children('.form-group').each(function(){
                      var cell_num = $(this).data('cell-num');
                      var input = $(this).find('input, select');
                      var cell_val="empty";
                      // console.log(new Date(input.val()).toISOString().slice(0, -1));
                      if(input.data('edit-type')=="text"){
                        cell_val = input.val();
                      }else if(input.data('edit-type')=="select2" || input.data('edit-type')=="select"){
                        cell_val = input.find('option:selected').text();
                      }else if(input.data('edit-type') == "date"){
                        // console.log(input);
                        cell_val = input.val();
                      }else{
                        // return false;
                      }

                      $(row).children().eq(cell_num).html(cell_val);
                    });
                    // END append new data to table cells
                    $modal.modal('hide');
                    $("#"+TABLE_SETTINGS['t_id']).find('table').trigger("updateAll");
                    var notify = notifyMessanger(MODAL_MESSAGES['notify'].success_update, 'success');
                    // notify end
                  }
                  else if (update_resp['req_status'] == 404) {
                    update_resp['falsy'].map(function(item){
                      $form.find('[name="'+item+'"]').closest('.form-group').addClass('has-error');
                    })

                  }
                }
              })
              // END make ajax request for data update
              return false;
            }
        },
        cancel: {
          className: 'btn-danger disabled'
        },
      },
    }).on("shown.bs.modal", function() {
      $(this).find('.btn').prop('disabled', true);
    });
  }); //END EDIT

  $(document).on('click', '.delete', function(e) {
    var self = $(this);
    var row = self.closest('tr');
    var dialogDelete = bootbox.dialog({
      title: MODAL_MESSAGES['modal'].delete['title']+row.data('rowUniq'),
      message: MODAL_MESSAGES['modal'].delete['message'],
      buttons:{
        confirm: {
            className: 'btn-success',
            callback: function(){
              var $modal = $(this);
              req_param={
                action: TABLE_SETTINGS['action']['delete_data'],
                rowUniq: row.data('rowUniq')
              };
              row.children().each(function(){
                if($(this).data().hasOwnProperty('inputName') ){
                  req_param[$(this).data('inputName')] = $(this).text();
                }
              })
              $.ajax({
                method: "POST",
                url: TABLE_SETTINGS.request_urls['delete'],
                data: req_param,
                dataType:"json",
                success: function(json){
                  if(json.req_status == 200){
                    $modal.modal('hide');
                    row.remove();
                    $("#"+TABLE_SETTINGS['t_id']).find('table').trigger("updateAll");
                    // notify
                    var notify = notifyMessanger(MODAL_MESSAGES['notify'].success_delete, 'success');
                    // notify end
                  }
                }
              })
              // END make ajax request for data update
              return false;
            }
        },
        cancel: {
          className: 'btn-danger'
        },
      },
    })
  })

  function switchEditType(set_data){
    // data-edit-type
    console.log(set_data);
    var wrapper = $('<div>').addClass('form-group').attr('data-cell-num', set_data.td_id);
    if(set_data.editType=="text"){ // input
      var inner_wrapper =
        $('<label>').text(set_data.label).add(
          $('<input>',{
            name:set_data.inputName,
            value: set_data.innerValue,
            class:"form-control",
            type:"text",
            'data-edit-type':set_data.editType,
            'required':true,
          })
        )
    }else if (set_data.editType=="select" || set_data.editType=="select2") { //select
      var $select = $('<select>',{
        name:set_data.inputName,
        class: "form-control",
        'data-edit-type':set_data.editType
      }).append(
        $('<option>').text(set_data.innerValue).attr({
          name:set_data.inputName,
          selected:true,
        })
      )
      var inner_wrapper = $('<label>').text(set_data.label).add($select);
    }else if (set_data.editType=="checkbox") { // checkbox
      // var checkbox_wrapper = $(innerValue).clone();
      // checkbox_wrapper.addClass('form-group').attr('data-cell-num', td_id).find('label').append(label).find('input');
      // wrapper = checkbox_wrapper;
      inner_wrapper = "";
    }else if (set_data.editType=="date") { // date
      var inner_wrapper = $('<label>').text(set_data.label).add(
        $('<input>',{
          name:set_data.inputName,
          value: set_data.innerValue,
          class:"form-control",
          type:"date",
          'data-edit-type':set_data.editType
        })
      )
    }
    // inser input to form
    $(inner_wrapper).appendTo(wrapper);
    if(set_data.hasOwnProperty('editType') && set_data.editType == "select2"){
      initializeSelect2($select); // select2
    }else if(set_data.hasOwnProperty('editType') && set_data.editType == "select"){
      initializeSelect($select); // select
    }
    return wrapper;
  }

  function getSelecteData(){

  }
  function initializeSelect(selectElementObj){
    $(selectElementObj).one('mouseover',function(e){
      $select = $(e.target);
      var select_name = $select.attr('name');
      // var selected = $select.find(":selected").data('value-id');
      if(!t_data_storage.hasOwnProperty(select_name)){
        $.ajax({
          method: "POST",
          url: TABLE_SETTINGS.request_urls['filter'],
          data: {
            action: TABLE_SETTINGS.action['get_selectdata'],
            select_name: select_name
          },
          beforeSend: function(){
            $select.attr('disabled',true).html('<option class="loader">loading ...</option>');
          },
          dataType:"json",
          success: function(json){
            if(json['req_status'] == 200){
              t_data_storage[$select.attr('name')]=json['data'][select_name];
              var data=JSON.parse(JSON.stringify(json['data'][select_name]));
              setSelectData({
                select:$select,
                data:data,
                // selected:selected
              });
            }
          }
        });
      }else if (t_data_storage.hasOwnProperty(select_name)) {
        setSelectData({
          select:$select,
          data:t_data_storage[select_name],
          // selected:selected
        })
      }
    })
  };

  function setSelectData(s_obj){
    var data = s_obj.data,
        select = s_obj.selec;
        // selected = s_obj.selected;
    select.html('');
    data.map(function(item){
      $('<option>',{
        text: item.text,
        value:item.id,
        // "data-value-id":item.id,
        // selected: (item.id==selected)?"selected":false,
      }).appendTo(select)
    });
    select.attr('disabled',false)
  }

  function initializeSelect2(selectElementObj) {
    $select = selectElementObj;
    select_name = $select.attr('name')
    //fix modal force focus
    $.fn.modal.Constructor.prototype.enforceFocus = function() {};
      if(!t_data_storage.hasOwnProperty(select_name)){
        $.ajax({
          url: TABLE_SETTINGS.request_urls['filter'],
          method:"POST",
          dataType:"json",
          data:{
            action: TABLE_SETTINGS.action['get_selectdata'],
            select_name: select_name
          },
          success:function(json){
            t_data_storage[select_name] = json['data'][select_name];
            $select.select2({
              theme:"bootstrap",
              data: t_data_storage[select_name],
            }).val('7').trigger('change');;
          }
        })
      }else{
        $select.select2({
          theme:"bootstrap",
          data: t_data_storage[select_name],
        });
      }
    }

  // update priority
  function updatePriority(){

  }
  // end update priority
  //
  function enableSortDragNDrop(table){
    console.log(table);
    if(TABLE_SETTINGS.is_dragable){
      var fixHelper = function(e, ui) {
        ui.children().each(function() {
          $(this).width($(this).width());
        });
        return ui;
      };

      $(table.$table).find('td:first').closest('tbody').sortable({
        axis: "y",
        helper: fixHelper,
        tolerance: "pointer",
        start: function( event, ui ){
          // var rows_before = (table.data.rows);
          $(ui.item).css({"border":"1px blue solid", cursor:'move'})
        },
        update: function( event, ui ){
          $(ui.item).css({ cursor:'default'})
          $(table.$table).find('tbody tr').each(function() {
            var rowUniq = $(this).data('row-uniq');
            $(this).children('td.priority').html($(this).index());

            (!order_req.hasOwnProperty(rowUniq)) ? order_req[rowUniq]={} : false;

            order_req[rowUniq]['newData']=$(this).index();
            order_req[rowUniq]['row_index']=rowUniq;
          });
          // var rows_diff =  Object.values(order_req).filter(function(i, index){
          //   return i.oldData != i.newData;
          // });

          // console.log(rows_diff);
          orderAction(order_req, table);
        }
      }).disableSelection();

      //

      //
    }
  }
  //
  function notifyMessanger(ms_obj, type){
    return $.notify({
      title: ms_obj,
    },{
      placement: {
        from: "top",
        align: "right"
      },
      type: type,
      timer: 2000,
      delay:1000,
      animate: {
        enter: 'animated fadeInDown',
        exit: 'animated fadeOutUp'
      },
      template: '<div data-notify="container" class="col-xs-8 col-sm-3 col-md-2 alert alert-{0}" role="alert">' +
        '<span data-notify="title">{1}</span> ' +
      '</div>'
    });
  }

  // SAVE/RESTORE order
  function orderAction(order, table){
    if($.isEmptyObject(order)){
      return false;
    }
    // Prevent Multiple
    if($('.reorder-notify').length){
      return false;
    }
    // notify
    var notify = $.notify({
    	title: "<strong>Вы изменили приоритет!</strong><br> ",
      message:"Сохраните изминения</br><hr>"
    },{
      type: 'danger',
      timer: false,
      onShow: function(){
        var resetOrder = $('<button>').attr('id', 'undo-order').addClass('btn btn-primary pull-right').html('<i class="fa fa-undo" aria-hidden="true"></i> Reset order?').on('click',function(e){
          var btn = $(this);
          // modalin
          bootbox.confirm({
            size: "small",
            message: MODAL_MESSAGES.order['undo'],
            buttons: {
              confirm: {
                label: 'Yes',
                className: 'btn-success'
              },
              cancel: {
                label: 'No',
                className: 'btn-danger'
              }
            },
            callback: function (result) {
              if(result){
                ResetOrder(notify, order_req, table);
              }
            }
          });
        });

        var newOrder = $('<button>').attr('id', 'save-order').addClass('btn btn-warning').html('<i class="fa fa-save"></i> Save order?').on('click',function(e){
          var btn = $(this);
          // modal
          bootbox.confirm({
            size: "small",
            message: MODAL_MESSAGES.order['save'],
            buttons: {
              confirm: {
                label: 'Yes',
                className: 'btn-success'
              },
              cancel: {
                label: 'No',
                className: 'btn-danger'
              }
            },
            callback: function (result) {
              if(result){
                SaveOrder(notify, order);
                console.log(order);
              }
            }
          });
        });
        $('.reorder-notify').append($('<div>').append(newOrder, resetOrder));
      },
      template: '<div data-notify="container" class="col-xs-8 col-sm-2 alert reorder-notify alert-{0}" role="alert">' +
    		'<span data-notify="title">{1}</span> ' +
    		'<div data-notify="message">{2}</div>' +
    		'<div class="progress" data-notify="progressbar">' +
    			'<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
    		'</div>' +
    		'<a href="{3}" target="{4}" data-notify="url"></a>' +
    	'</div>'
    });
  }// END SAVE/RESTORE order dialog

  // Save New Order
  function SaveOrder(notify, order){
    $.ajax({
      url:TABLE_SETTINGS.request_urls['update'],
      dataType: "json",
      data: {
        order:order,
        action: TABLE_SETTINGS['action'].update_order
      },
      type: "POST",
      success: function(json){
        if(json['req_status'] == 200){
          notify.close();
        }else if(json['req_status'] == 404){
          bootbox.alert({
            title:"Fail",
            message: "Повторите сохранение",
          })
        }
      }
    });
  }
  // Reset Order
  function ResetOrder(notify, order, table){
    console.log(order);
    Object.keys(order).map(function(id){
      $('['+TABLE_SETTINGS['data_row_uniq']+'="'+id+'"]').find('.priority').each(function(){
        table.cell( $(this) ).data( order[id].oldData).draw();
      });
    });
    table.rows().invalidate().draw(false);
    notify.close();
    return order_req={};
  }
}// End Main Function

editable_table(TABLE_SETTINGS);
