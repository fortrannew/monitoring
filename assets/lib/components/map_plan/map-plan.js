class lcp_map_plan {
  constructor() {
    this.scale_step = 0.1;
    this.scale_max = 5;
    this.zoom = 1.0;
    this.pos_x_orig = 0;
    this.pos_y_orig = 0;
    this.width_orig = 0;
    this.height_orig = 0;
    this.marker = new lcp_list_marker(this);
    this.moving_marker = true;
    this.moving_marker_index = null; // Хранит индекс маркера, который перемещается
    this.is_touching = false;
  }










  init(obj_id) {
    var self = this;
    self.obj_id = obj_id;
    self.obj = self.get_obj(self.obj_id);




    // canvas
    self.canvas_id = self.obj_id + '_canvas';
    let canvas = document.createElement('canvas');
    canvas.id = self.canvas_id;
    canvas.innerHTML = 'Ваш браузер не поддерживает функции для работы с картой помещения!';
    canvas.width = self.obj.offsetWidth;
    canvas.height = self.obj.offsetHeight;
    self.obj.appendChild(canvas);
    self.canvas = self.get_obj(self.canvas_id);
    self.ctx = self.canvas.getContext('2d');
    self.canvas_width = canvas.width;
    self.canvas_height = canvas.height;



    // возможность масштабировать
    self.addOnWheel(self.canvas, function (e) {
      var delta = e.deltaY || e.detail || e.wheelDelta;
      var zoom = self.zoom;
      var mouse_x = e.offsetX;
      var mouse_y = e.offsetY;

      // Рассчитать относительные координаты для мыши в текущем масштабе
      let mouse_x_rel = (mouse_x - self.pos_x) / self.zoom;
      let mouse_y_rel = (mouse_y - self.pos_y) / self.zoom;

      // Изменение масштаба
      if (delta > 0) {
        zoom -= self.scale_step;
      } else {
        zoom += self.scale_step;
      }
      if (zoom > self.scale_max) {
        zoom = self.scale_max;
      }
      if (zoom < 0.1) {
        zoom = 0.1;
      }


      // Обновить зум
      self.zoom = zoom;

      // Рассчитать новое положение, чтобы курсор оставался в том же месте
      self.pos_x = mouse_x - mouse_x_rel * self.zoom;
      self.pos_y = mouse_y - mouse_y_rel * self.zoom;

      self.repaint();

      // отменим прокрутку
      e.preventDefault();
    });




    // Поддержка тачпада
    self.canvas.addEventListener('touchstart', function (e) {
      if (e.touches.length == 2) {
        self.is_touching = true;
        self.last_dist = self.get_distance(e.touches);
      } else if (e.touches.length == 1) {
        self.is_touching = false;
        let touch = e.touches[0];
        self.start_x = touch.clientX;
        self.start_y = touch.clientY;

        var hover_marker_index = self.hover_marker_touch(touch.clientX, touch.clientY, self);
        
        if (hover_marker_index !== false) {
          if (self.moving_marker==false){
            self.moving_marker_index = null;
          } else {
            self.moving_marker_index = hover_marker_index; // Сохраняем индекс маркера
          }
        } else {
          self.moving_marker_index = null; // Если не маркер, то не перемещаем
        }
      }
    });

    self.canvas.addEventListener('touchmove', function (e) {
      if (self.is_touching && e.touches.length == 2) {
        let new_dist = self.get_distance(e.touches);
        let scale_change = new_dist / self.last_dist;
        self.zoom *= scale_change;

        if (self.zoom > self.scale_max) {
          self.zoom = self.scale_max;
        }
        if (self.zoom < 0.1) {
          self.zoom = 0.1;
        }

        // Центрирование масштаба
        let center_x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        let center_y = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        let mouse_x_rel = (center_x - self.pos_x) / self.zoom;
        let mouse_y_rel = (center_y - self.pos_y) / self.zoom;

        self.pos_x = center_x - mouse_x_rel * self.zoom;
        self.pos_y = center_y - mouse_y_rel * self.zoom;

        self.last_dist = new_dist;
        self.repaint();

        e.preventDefault();
      } else if (e.touches.length == 1) {
        let move_x = e.touches[0].clientX - self.start_x;
        let move_y = e.touches[0].clientY - self.start_y;

        if (self.moving_marker_index !== null) {
          self.marker.items[self.moving_marker_index].pos_x += move_x;
          self.marker.items[self.moving_marker_index].pos_y += move_y;
        } else {
          self.pos_x += move_x;
          self.pos_y += move_y;
        }

        self.start_x = e.touches[0].clientX;
        self.start_y = e.touches[0].clientY;

        self.repaint();

        e.preventDefault();
      }
    });

    self.canvas.addEventListener('touchend', function (e) {
      self.moving_marker_index = null; // Завершаем перемещение маркера
    });

    // style
    let style = document.createElement('style');
    style.media = 'screen';
    style.innerHTML = '';
    style.innerHTML += '#' + self.canvas_id + '{';
    style.innerHTML += 'border: 1px solid #cccccc;';
    style.innerHTML += 'width:' + self.canvas_width + 'px;';
    style.innerHTML += 'height:' + self.canvas_height + 'px;';
    style.innerHTML += '}';
    self.obj.appendChild(style);
  }












  // функция для получения объекта из идентификатора
  get_obj(obj_id) {
    return document.getElementById(obj_id);
  }

  // Вычисление расстояния между двумя пальцами (для pinch-жеста)
  get_distance(touches) {
    let touch1 = touches[0];
    let touch2 = touches[1];
    let dx = touch1.clientX - touch2.clientX;
    let dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // добавление фона изображения (path - string)
  add_background(path) {
    var self = this;
    self.marker.clear();
    self.img_path = path;
    self.img_id = self.obj_id + '_img';
    let img = document.createElement('img');
    img.id = self.img_id;
    img.style = 'display:none;';
    img.src = self.img_path;
    self.obj.appendChild(img);
    self.pos_x_orig = 0;
    self.pos_y_orig = 0;

    img.onload = function () {
      self.img = this;
      self.width_orig = this.width * self.scale_max;
      self.height_orig = this.height * self.scale_max;
      self.repaint();
      self.add_move();
      console.log('back');
    };
  }



  // получить коэффициент увеличения
  zoom_coefficient(val_original) {
    var self = this;
    return val_original * self.zoom / self.scale_max;
  }

  // получить оригинальный коэффициент увеличения
  zoom_coefficient_orig(val_current) {
    var self = this;
    return (val_current * self.scale_max) / self.zoom;
  }


  // получение новых размеров исходя из оригинальных с учетом коэффициента масштабирования
  get width() {
    var self = this;
    return self.zoom_coefficient(self.width_orig);
  }


  // получение новых размеров исходя из оригинальных с учетом коэффициента масштабирования
  get height() {
    var self = this;
    return self.zoom_coefficient(self.height_orig);
  }


  // получение новых позиций исходя из оригинальных с учетом коэффициента масштабирования
  get pos_x() {
    var self = this;
    return self.zoom_coefficient(self.pos_x_orig);
  }

  set pos_x(x) {
    var self = this;
    var pos_x_orig_old = self.pos_x_orig;
    var res = self.zoom_coefficient_orig(x);
    var diff = res - pos_x_orig_old;
    for (var i = 0; i < self.marker.length; i++) {
      self.marker.items[i].pos_x_orig = self.marker.items[i].pos_x_orig + diff;
    }
    self.pos_x_orig = res;
  }


  // получение новых позиций исходя из оригинальных с учетом коэффициента масштабирования
  get pos_y() {
    var self = this;
    return self.zoom_coefficient(self.pos_y_orig);
  }

  set pos_y(x) {
    var self = this;
    var pos_y_orig_old = self.pos_y_orig;
    var res = self.zoom_coefficient_orig(x);
    var diff = res - pos_y_orig_old;
    for (var i = 0; i < self.marker.length; i++) {
      self.marker.items[i].pos_y_orig = self.marker.items[i].pos_y_orig + diff;
    }
    self.pos_y_orig = res;
  }


  // перерисовать фон изображения
  repaint_background() {
    var self = this;
    self.clear_all();
    self.ctx.drawImage(self.img, self.pos_x, self.pos_y, self.width, self.height);
  }

  repaint() {
    var self = this;
    self.repaint_background();
    self.marker.repaint_all_marker();
  }







  // получение центра карты исходя из оригинальных размеров без учета коэффициента масштабирования (по реальным неизменяющимся координатам)
  get center_x() {
    var self = this;
    return self.zoom_coefficient_orig(self.pos_x)* (-1) + self.zoom_coefficient_orig(self.canvas_width / 2);
  }

  get center_y() {
    var self = this;
    return self.zoom_coefficient_orig(self.pos_y)* (-1) + self.zoom_coefficient_orig(self.canvas_height / 2);
  }

  // установить центр карты исходя из оригинальных размеров без учета коэффициента масштабирования с визуальным перемещением
  set center_x(x) {
    var self = this;
    var res = x - self.zoom_coefficient_orig(self.canvas_width / 2);
    self.pos_x = self.zoom_coefficient(res * (-1));
    self.repaint();
  }

  set center_y(y) {
    var self = this;
    var res = y - self.zoom_coefficient_orig(self.canvas_height / 2);
    self.pos_y = self.zoom_coefficient(res * (-1));
    self.repaint();
  }


  add_move() {
    var self = this;
    var new_x;
    var new_y;
    var smesch_x;
    var smesch_y;
    var last_pos_x;
    var last_pos_y;
    var last_pos_x_markers = [];
    var last_pos_y_markers = [];
    var mouse_x;
    var mouse_y;
    var move_marker_only = false;
    var mouse_down = false;

    self.canvas.onmousemove = function (event) { self.canvas_mouse_move(event, self); };

    self.canvas.onmousedown = function (event) {
      new_x = 0;
      new_y = 0;
      mouse_x = event.offsetX;
      mouse_y = event.offsetY;
      smesch_x = mouse_x;
      smesch_y = mouse_y;
      mouse_down = true;

      // определение нажатия на маркер. если нажат, то move_marker_only=true
      var hover_marker_index = self.hover_marker_index(event, self);
      move_marker_only = hover_marker_index === false ? false : true;
      self.marker.active = hover_marker_index === false ? '-1' : hover_marker_index;

      // выполнение событий маркера
      if (move_marker_only===true){
        if (typeof self.marker.items[hover_marker_index].onclick==='function'){
          self.marker.items[hover_marker_index].onclick();
        }
      }
      console.log('move_marker_only', move_marker_only);

      // если self.moving_marker==false - запретить перетаскивать маркеры
      if (self.moving_marker===false){
        move_marker_only = false;
      }

      // сохранить предыдущую позицию всех маркеров и карты
      for (var i = 0; i < self.marker.length; i++) {
        last_pos_x_markers[i] = self.marker.items[i].pos_x;
        last_pos_y_markers[i] = self.marker.items[i].pos_y;
      }
      last_pos_x = self.pos_x;
      last_pos_y = self.pos_y;

      self.canvas.onmousemove = function (event) {
        mouse_x = event.offsetX;
        mouse_y = event.offsetY;
        new_x = mouse_x - smesch_x;
        new_y = mouse_y - smesch_y;
        if (move_marker_only == true) {
          for (var i = 0; i < self.marker.length; i++) {
            if (i == self.marker.active) {
              self.marker.items[self.marker.active].pos_x=last_pos_x_markers[self.marker.active] + new_x;
              self.marker.items[self.marker.active].pos_y=last_pos_y_markers[self.marker.active] + new_y;
            }
          self.repaint();
          }
        } else {
          self.pos_x=last_pos_x + new_x;
          self.pos_y=last_pos_y + new_y;
          self.repaint();
        }
      }
      self.canvas.onmouseup = function (event) {
        mouse_down = false;
        self.canvas.onmousemove = function (event) { self.canvas_mouse_move(event, self); };
        if (move_marker_only == true) {
          self.marker.items[self.marker.active].pos_x = last_pos_x_markers[self.marker.active] + new_x;
          self.marker.items[self.marker.active].pos_y = last_pos_y_markers[self.marker.active] + new_y;
        } else {
          self.pos_x = last_pos_x + new_x;
          self.pos_y = last_pos_y + new_y;
          for (var i = 0; i < self.marker.length; i++) {
            self.marker.items[i].pos_x = last_pos_x_markers[i] + new_x;
            self.marker.items[i].pos_y = last_pos_y_markers[i] + new_y;
          }
        }
        self.repaint();
        move_marker_only = false;
        self.canvas.onmouseup = null;
      }
      self.canvas.onmouseout = function (event) {
        if (mouse_down == true) {
          self.canvas.onmouseup(event);
        }
      }
    }
  }




  // при наведении мышкой на маркер - изменить курсор
  canvas_mouse_move(event, self) {
    if (self.hover_marker_index(event, self) === false) {
      self.canvas.style.cursor = 'grabbing';
    } else {
      self.canvas.style.cursor = 'pointer';
    }
  }


  // возвращает:
  // - индекс маркера, если мышка на маркере
  // - false, если мышка вне диапазона,
  hover_marker_index(event, self) {
    var self = this;
    var mouse_x = event.offsetX;
    var mouse_y = event.offsetY;
    var res = false;
    for (var i = 0; i < this.marker.length; i++) {
      if (
      ((mouse_x + self.pos_x >= (self.marker.items[i].pos_x - self.marker.items[i].width / 2) + self.pos_x) && (mouse_x + self.pos_x <= (self.marker.items[i].pos_x + self.marker.items[i].width / 2) + self.pos_x))&&
      ((mouse_y + self.pos_y >= (self.marker.items[i].pos_y - self.marker.items[i].height / 2) + self.pos_y) && (mouse_y + self.pos_y <= (self.marker.items[i].pos_y + self.marker.items[i].height / 2) + self.pos_y))
      ){
        res = i;
        break;
      } else {
        res = false;
      }
    }
    return res;
  }



  hover_marker_touch(touch_x, touch_y, self) {
    for (let i = 0; i < self.marker.items.length; i++) {
      let marker = self.marker.items[i];
      let marker_x = marker.pos_x;
      let marker_y = marker.pos_y;
      let marker_radius = marker.radius || 10; // Радиус маркера

      if (
        touch_x >= marker_x - marker_radius &&
        touch_x <= marker_x + marker_radius &&
        touch_y >= marker_y - marker_radius &&
        touch_y <= marker_y + marker_radius
      ) {
        return i;
      }
    }
    return false;
  }

  // очистить весь фон
  clear_all() {
    var self = this;
    self.ctx.clearRect(0, 0, self.canvas_width, self.canvas_height);
  }

  // общее событие для всех прокруток мыши
  addOnWheel(elem, handler) {
    if (elem.addEventListener) {
      if ('onwheel' in document) {
        // IE9+, FF17+
        elem.addEventListener("wheel", handler);
      } else if ('onmousewheel' in document) {
        // устаревший вариант события
        elem.addEventListener("mousewheel", handler);
      } else {
        // 3.5 <= Firefox < 17, более старое событие DOMMouseScroll пропустим
        elem.addEventListener("MozMousePixelScroll", handler);
      }
    } else { // IE8-
      elem.attachEvent("onmousewheel", handler);
    }
  }
}




















// -----------------------------------------------------------------------------------


// // Создание маркеров
//
// // (type=circle,width=20,height=20):
// {
//   color:'#ff0000',
// }
//
// // (type=circle,width=20,height=20):
// {
//   color:'#ff0000',
//   width=20,
//   height=20,
// }
//
// // (type=circle,width=20,height=20):
// {
//   color:'#ff0000',
//   position:[20,20],
// }
//
// // (type=circle,width=20,height=20,color:'#ff0000'):
// {
//   position:[20,20],
// }
//
// чтобы запретить перетаскивать маркер (true по-умолчанию):
// map_plan.moving_marker = false;

class lcp_marker {
  constructor(parent, param) {
    this.parent = parent;
    param = (typeof param !== 'undefined') ? param : {};
    this.id = (typeof param['id'] !== 'undefined') ? param['id'] : '';
    this.type = (typeof param['type'] !== 'undefined') ? param['type'] : 'circle';
    this.width = (typeof param['width'] !== 'undefined') ? param['width'] : '20';
    this.height = (typeof param['height'] !== 'undefined') ? param['height'] : '20';
    this.color = (typeof param['color'] !== 'undefined') ? param['color'] : '#ff0000';
    this.pos_x_orig = (typeof param['position'] !== 'undefined') ? Number(Number(param['position'][0]) + Number(this.parent.pos_x_orig)) : this.parent.zoom_coefficient_orig(this.parent.canvas_width / 2);
    this.pos_y_orig = (typeof param['position'] !== 'undefined') ? Number(Number(param['position'][1]) + Number(this.parent.pos_y_orig)) : this.parent.zoom_coefficient_orig(this.parent.canvas_height / 2);
    if (typeof param['onclick'] !== 'undefined'){
      this.onclick =  param['onclick'];
    }
    console.log(this.pos_x_orig);
  }

  get pos_x() {
    var self = this;
    return self.parent.zoom_coefficient(self.pos_x_orig);
  }

  set pos_x(x) {
    var self = this;
    self.pos_x_orig = self.parent.zoom_coefficient_orig(x);
  }

  get pos_y() {
    var self = this;
    return self.parent.zoom_coefficient(self.pos_y_orig);
  }

  set pos_y(x) {
    var self = this;
    self.pos_y_orig = self.parent.zoom_coefficient_orig(x);
  }

  repaint_marker() {
    var self = this;
    if (self.type == 'circle') {
      self.parent.ctx.beginPath();
      self.parent.ctx.strokeStyle = self.color;
      self.parent.ctx.lineWidth = '5';
      self.parent.ctx.arc(self.pos_x, self.pos_y, self.width / 2, 0, 2 * Math.PI, false);
      self.parent.ctx.stroke();
      self.parent.ctx.closePath();
      self.parent.ctx.beginPath();
      self.parent.ctx.fillStyle = self.color;
      self.parent.ctx.arc(self.pos_x, self.pos_y, 4, 0, 2 * Math.PI, false);
      self.parent.ctx.fill();
      self.parent.ctx.closePath();
    }
  }
}






// Общие свойства всех маркеров
class lcp_list_marker {
  constructor(parent) {
    this.items = [];
    this.parent = parent;
    this.active = -1;
  }
  add(param) {
    var self = this;
    self.items[self.length] = new lcp_marker(self.parent, param);
    self.repaint_all_marker();
  }
  clear(){
    var self = this;
    self.items=[];
    self.active=-1;
  }
  get length() {
    var self = this;
    return self.items.length;
  }
  repaint_all_marker() {
    var self = this;
    for (var i = 0; i < self.length; i++) {
      self.items[i].repaint_marker();
    }
  }
  get_position(){
    var self = this;
    var res_arr={};
    for (var i = 0; i < self.length; i++) {
      res_arr[i]={};
      res_arr[i].id=self.items[i].id;
      res_arr[i].x=self.items[i].pos_x_orig-self.parent.pos_x_orig;
      res_arr[i].y=self.items[i].pos_y_orig-self.parent.pos_y_orig;
    }
    return res_arr;
  }
}


const map_plan = new lcp_map_plan();
