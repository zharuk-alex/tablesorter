<?php
session_start();

  $connection = mysqli_connect('localhost', 'root', 'rp58bnar', 'opencart');
  mysqli_set_charset($connection, "utf8");
	error_reporting(E_ERROR);

  // action 1 - read data
  // action 2 - insert new data
  // action 3 - update order
  // action 4 - update data
  // action 5 - delete data
  // action 6 - get filter

  // Если у ячейки есть ключ data-edit-type - ячейку можно радактировать. Значение ключа - вид input'a. Ниже доступные значения
  // data-edit-type - select или select2
  // data-edit-type - text
  // data-edit-type - checkbox
  // data-edit-type - textarea
  // data-edit-type - date Дата в формате YYYY-mm-dd

  // VARIABLES to JS
  $TABLE_SETTINGS = array(
    't_id' => "tablesorter_container", // html-tag id
    'is_expandable' => true, // true/false - разрешено добавление новых элентов
    'is_dragable' => true, // true/false - разрешено добавление новых элентов
    // 'order_buttons_container' => 'test-table-order_btn', //id для контейнера кнопок сортировки
    // 'data_row_uniq'=>'data-row-uniq', // Имя Data-attr для строки
    'request_urls' => array(  // Урлы реквестов могут быть любые
      'read' => "ajax/t_data.php",
      'update' => "ajax/t_data.php",
      'insert' => "ajax/t_data.php",
      'delete' => "ajax/t_data.php",
      'filter' => "ajax/t_data.php"
    ),
    'action'=> array(
      'read' => 1,
      'insert' => 2,
      'update_order' => 3,
      'update_data' => 4,
      'delete_data' => 4,
      'get_selectdata' => 6
    ),
    // "tablesorter_widgets" => array("uitheme", "columns","filter", "zebra" ),
    "tablesorter_widgets" => array("uitheme", "columns" ),
  );

  $MODAL_MESSAGES = array(
    'locales' => 'ru',
    'order' => array(
      'save' => "Сохранить Сортировку?",
      'undo' => "Сбросить Сортировку?"
    ),
    'modal' => array(
      'add' =>  array('title' => "Добавление новой записи "),
      'edit' =>  array('title' => "Вы редактируете запись: "),
      'delete' =>  array('title' => "Вы собираетесь удалить запись: ", 'message' => "Вы уверены, что хотите удалить запись ?"),
    ),
    'notify' => array(
      'success_update' => 'Данные успешно обновлены!',
      'success_delete' => 'Запись успешно удалена!',
    )
  );


  function defaultCellsArray($row){
    //
    $__btn_edit = "Edit";
    $__btn_delete = "Delete";
    $btn_edit = '<button type="button" name="edit" class="btn btn-info edit" title="'.$__btn_edit.'"><i class="fa fa-pencil"></i></button>';
    $btn_delete = '<button type="button" name="delete" class="btn btn-danger delete" title="'.$__btn_delete.'"><i class="fa fa-trash-o"></i></button>';
    //
    $row_data = array(
      // array(
      //   "text" => $row['sort_order'],
      //   "data-input-name" => "priority",
      //   "data-sortlist" => "[[0,0],[4,0]]", // Сортировка по умолчанию
      //   "class"=> "priority reordable", // Наличие класоов означает что таблица поддерживает dragndrop сортировку
      // ),

      array(
        "text"=> $row['name'], // td value
        "data-edit-type"=>"text", // input type. If not exist - field not editable
        "data-input-name"=> "product_title" // attr name for input serialize / $_POST['product_title']
      ),
      array(
        "text"=> $row['model'], // td value
        "data-edit-type"=>"text", // input type. If not exist - field not editable
        "data-input-name"=> "model" // attr name for input serialize / $_POST['product_title']
      ),
      array(
        "text"=> $row['m_name'],
        "data-edit-type"=>"select2", // select or select2 for SELECT2 plugin
        "data-input-name"=> "manufacturer",
        "value" => $row['manufacturer_id'],
        'data-value-id'=>$row['manufacturer_id'] // If exist data-value-id - В ajax на сервер передается value-id, Else - передается td value
      ),

      array(
        "text"=> $row['price'],
        "data-edit-type"=>"text",
        "data-input-name"=> "price",
      ),
      array( "text"=> $row['date_available'], "data-edit-type"=>"date", "data-input-name"=> "date_available"),
      array( "text"=> $row['status'], "data-edit-type"=>"checkbox", "data-input-name"=> "status"),
      array( "text"=> $row['date_modified']),

      $btn_edit,
      $btn_delete
    );
    return $row_data;
  }
  // END VARIABLES
  //////////////////////////////////////////////////// GET INIT DATA ///////////////////////////////////////////////////////////////////////////
  if(isset($_GET['action']) && $_GET['action'] == 1){
    unset($json);
    // Заголовки
    // "text" - Заголовок
    // data-sorter - Сортировка (true/false)
    // data-filter - Фильтр (true/false)
    // "settings" - типы полей для добавления нового item'a   // отсутвие "settings" - указывает, что этого поля не будет в дообавлении нового элемента в модальном окне.

    $json['headers'][] = array(
      // array("text" => "Приоритет", "width"=> "30px"),
      array("text" => "Title",
        "settings"=>array(
          "data-edit-type"=>"text",
          "data-input-name"=> "product_title"
        )
      ),
      array("text" => "model"),
      array("text" => "Производитель", "class"=> "manufacturer",
        "settings"=>array(
          "data-edit-type"=>"select2",
          "data-input-name"=> "manufacturer_id"
        )
      ),
      array("text" => "Цена",
        "settings"=>array(
          "data-edit-type"=>"text",
          "data-input-name"=> "price"
        )
      ),
      array("text" => "Date available",
        "settings"=>array(
          "data-edit-type"=>"date",
          "data-input-name"=> "date_available"
        )
      ),
      array("text" => 'Активный',"data-sorter"=> false,"data-filter" => "false",
        "settings"=>array(
          "data-edit-type"=>"checkbox",
          "data-input-name"=> "status"
        )
      ),
      array("text" => "Date modified", "class"=> "date", "width"=> "20%"),
      array("text"=>"Edit","data-sorter"=> false,"width"=> "50px", "data-filter" => false),
      array("text"=>"Delete","data-sorter"=> false,"width"=> "50px", "data-filter" => false),
    );

    $json["footers"] = "clone";


    $q="SELECT p.*, pd.name, pd.description, pd.meta_description, m.name AS m_name
    FROM oc_product_description pd
    JOIN oc_product p ON (pd.product_id=p.product_id)
    LEFT JOIN oc_manufacturer m ON (m.manufacturer_id=p.manufacturer_id) ORDER BY sort_order ASC;";

    $rst_sc = mysqli_query($connection,$q);
  	while($row = mysqli_fetch_array ($rst_sc, MYSQLI_BOTH)) {
      $json["rows"][] = array(
        "cells" =>  defaultCellsArray($row),
        'data-row-uniq' => $row['product_id'],
        // available add any data-attr or class for tr_row
      );
    }

    if (empty($json["rows"])){
      $json["rows"][] = array(""); // Наличие rows - обьязательно. Массив с данными или пустой.
    }

    echo json_encode($json, JSON_PRETTY_PRINT);
  }


  //////////////////////////////////////////////////// UPDATE DATA ///////////////////////////////////////////////////////////////////////////
  elseif (isset($_POST['action']) && $_POST['action'] == $TABLE_SETTINGS['action']['update_data'] && isset($_POST['rowUniq'])){
    unset($json);
    // Тестовая логика
    $queries=[];
    $uniq=intval($_POST['rowUniq']);
    if(isset($_POST['price'])) {
      $sql_price="UPDATE oc_product SET price=".floatval($_POST['price'])." WHERE product_id=".$uniq.";";

      $queries['price'] = (mysqli_query($connection, $sql_price)) ? true : false;
    }

    if(isset($_POST['product_title'])) {
      $sql_name="UPDATE oc_product_description SET name='".$_POST['product_title']."' WHERE product_id=".$uniq.";";

      $queries['product_title'] = (mysqli_query($connection, $sql_name)) ? true : false;
    }

    if(isset($_POST['model'])) {
      $model = $_POST['model'];
      $sql_model="UPDATE oc_product SET model='".$model."' WHERE oc_product.product_id=".$uniq.";";

      $queries['model'] = (mysqli_query($connection, $sql_model)) ? true : false;
    }

    if(isset($_POST['manufacturer'])) {
      $manufacturer_id = $_POST['manufacturer'];
      $sql_manufacturer="UPDATE oc_product SET manufacturer_id='".$manufacturer_id."' WHERE oc_product.product_id=".$uniq.";";

      $queries['manufacturer'] = (mysqli_query($connection, $sql_manufacturer)) ? true : false;
    }

    if(isset($_POST['date_available'])) {
      $date = date('Y-m-d', strtotime($_POST['date_available']));
      $sql_date="UPDATE oc_product SET date_available='".$date."',  date_modified = NOW() WHERE oc_product.product_id=".$uniq.";";

      $queries['date_available'] = (mysqli_query($connection, $sql_date)) ? true : false;
    }

    $json['req_status'] = 200;


    echo json_encode($json);
  }// END UPDATE DATA




  /////////////////////////////////////////////////// INSERT DATA/////////////////////////////////////////////////////////////////////////////
  elseif (isset($_POST['action']) && $_POST['action'] == $TABLE_SETTINGS['action']['insert']){
    unset($json);
    // Тестовая логика
    $data = array(
      'product_title' => $_POST['product_title'],
      'model' => $_POST['model'],
      'date_available' => $_POST['date_available'],
      'manufacturer_id' => $_POST['manufacturer_id'],
      'price' => $_POST['price'],
      'status' => $_POST['status'],
      'sort_order'=>$_POST['sort_order']
    );
    // SQL QUERY Inset new data
    $q_insert="INSERT INTO oc_product
    SET model = '".$data['model']."',
    sku = '', upc = '', ean = '', jan = '', isbn = '', mpn = '', location = '',
    quantity = 0, minimum = 0, subtract = 0, stock_status_id = 0,
    date_available = '".$data['date_available']."',
    manufacturer_id = '" . (int)$data['manufacturer_id'] . "',
    shipping = 0,
    price = '" . (float)$data['price'] . "',
    points = 0, weight = 0, weight_class_id = 0, length = 0, width = 0, height = 0, length_class_id = 0, status = '" . (int)$data['status'] . "', tax_class_id = 0, sort_order = '0', date_added = NOW(), date_modified = NOW();";

    mysqli_query($connection, $q_insert);

    $last_id = mysqli_insert_id($connection);

    $q_product_description = "INSERT INTO oc_product_description SET product_id = '" .$last_id. "', language_id = '1',
    name = '" . $data['product_title'] . "', description = '', tag = '', meta_title = '', meta_description = '', meta_keyword = '' ;";

    mysqli_query($connection, $q_product_description);
    // $json['$last_id']=$last_id;
    $get_row = "SELECT p.*, pd.name, pd.description, pd.meta_description, m.name AS m_name
    FROM oc_product_description pd
    LEFT JOIN oc_product p ON (pd.product_id=p.product_id)
    LEFT JOIN oc_manufacturer m ON (m.manufacturer_id=p.manufacturer_id) WHERE p.product_id=".$last_id.";";

    $rst_sc = mysqli_query($connection,$get_row);
  	while($row = mysqli_fetch_array ($rst_sc, MYSQLI_BOTH)) {
      // Возвращаем новую запись
      $json["row"] = array(
        "cells" =>  defaultCellsArray($row),
        'data-row-uniq' => $row['product_id'],
        'class'=>'ui-sortable-handle'
      );
    }

    $json['req_status'] = 200 ;//required
    echo json_encode($json);
  } // END INSERT DATA



  //////////////////////////////////////////////////// DELETE DATA ///////////////////////////////////////////////////////////////////////////
    elseif (isset($_POST['action']) && $_POST['action'] == $TABLE_SETTINGS['action']['delete_data'] && isset($_POST['rowUniq'])){
      unset($json);
      // SQL QUERY

      // $json['req_status'] = (mysqli_query($connection, $sql)) ? 200 :  404;//required
      $json['req_status'] = 200;
    }
  // END DELETE DATA



  //////////////////////////////////////////////////// GET FILTER SELECT///////////////////////////////////////////////////////////////////
  elseif (isset($_POST['action']) && $_POST['action'] == 6 && isset($_POST['select_name'])){
    // Тестовая логика
    $sql="SELECT * FROM oc_manufacturer;";


    $rst_sc = mysqli_query($connection,$sql);
  	while($row = mysqli_fetch_array ($rst_sc, MYSQLI_BOTH)) {
      // json data for select2
      $json['data'][$_POST['select_name']][]=array(
        'text' => $row['name'],
        // 'id' => $row['name'],
        'id' => $row['manufacturer_id'],
      );

    }
    $json['req_status'] = (mysqli_query($connection, $sql)) ? 200 :  404;//required
    echo json_encode($json, JSON_PRETTY_PRINT);
  }// END GET FILTER FROM SELECT
  // UPDATE ORDER///////////////////////////////
  elseif (isset($_POST['action']) && $_POST['action'] == 3 && isset($_POST['order'])){
    unset($sql);
    foreach ($_POST['order'] as $key => $value) {

      $sql="UPDATE oc_product SET sort_order=".intval($value['newData'])." WHERE product_id=".$value['row_index'].";";

      $json['req_status'] = (mysqli_query($connection, $sql)) ? 200 :  404;//required
    }
    echo json_encode($json);
  } // END UPDATE ORDER
  else{
    $view_data['table_settings'] = $TABLE_SETTINGS;
    $view_data['modal_messages'] = $MODAL_MESSAGES;
    initTable($view_data);
  }

?>




<?php
function initTable($data){
  $table_settings = array_key_exists("table_settings", $data) ? $data['table_settings'] : "";
  $modal_messages = array_key_exists("table_settings", $data) ? $data['modal_messages'] : "";
  ?>
  <div class="col-lg-12">
    <div id="<?php echo($table_settings['t_id']) ;?>"></div>

    <?php if($table_settings['is_expandable']){ // show button for add new item to table    ?>
      <hr>
      <button id="btn-newItem" type="button" data-toggle="tooltip" title="" class="btn btn-primary pull-right" data-original-title="Add" >
        <i class="fa fa-plus"></i>
      </button>
    <?php } ?>



  </div>
  <script type="text/javascript">
  <?php /* Передаем параметры таблицы в JS */ ?>
    const TABLE_SETTINGS = <?php echo json_encode($table_settings); ?>;
    const MODAL_MESSAGES = <?php echo json_encode($modal_messages); ?>;
  </script>
<?php }?>
