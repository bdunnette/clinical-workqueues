
//--------------------------------------------------------------------------
// Layout Helper Functions


// this is the main workhorse function that is responsible for actually rendering
// the workqueues page correctly; it gets called on render, resize, orientation change,
// and a few other situations.

layoutWorkqueuesPage = function() {
    console.log('layoutworkquesPage()');

    if (window.innerWidth > 767) {
        if (Session.get('show_sidebar_panel')) {
            $('#mainLayoutPane').css('width', window.innerWidth - 195);
            $('.card-body-resize').css('width', window.innerWidth - 235);
            $('.card-footer-resize').css('width', window.innerWidth - 235);
        } else {
            $('#mainLayoutPane').css('width', window.innerWidth);
            $('.card-body-resize').css('width', window.innerWidth - 40);
            $('.card-footer-resize').css('width', window.innerWidth - 40);
        }
    } else if (window.innerWidth < 767) {
        $('#mainLayoutPane').css('width', window.innerWidth);
        $('.card-body-resize').css('width', window.innerWidth - 40);
        $('.card-footer-resize').css('width', window.innerWidth - 40);
    } else if (window.innerWidth < 480) {
        $('#mainLayoutPane').css('width', window.innerWidth);
        $('.card-body-resize').css('width', window.innerWidth - 40);
        $('.card-footer-resize').css('width', window.innerWidth - 40);
    }
}


//--------------------------------------------------------------------------
// Workqueues Templates

Template.workqueuesPageTemplate.rendered = function(){
    console.log('Template.workqueuesPageTemplate.rendered');
    layoutWorkqueuesPage();
};


// the secret sauce for getting an app to resize correctly is to use a Monad
// note how we begin with a template variable that we want to calculate
// and how the reactive session variable is defined last
Template.workqueuesPageTemplate.resized = function(){
    setSidebarVisibility();
    layoutWorkqueuesPage();
    return Session.get("resized");
};

// TODO:  move dropboxAlert from workqueueTemplate to workqueuesPageTemplate
Template.workqueueTemplate.receivedNewAlert = function(){
    return monitorDropbox();
};


//--------------------------------------------------------------------------
// New Task Input Bar

Template.workqueuesPageTemplate.events({
    'click #newTaskInput': function(evt,tmpl){
        if($('#newTaskInput').val() == 'add new task'){
            $('#newTaskInput').removeClass('lightgray');
            $('#newTaskInput').val('');
        }
    }
});
Template.workqueuesPageTemplate.events(okCancelEvents(
    '#newTaskInput',
    {
        ok: function (text, evt) {
            console.log('ok called on new todo item');
            var tag = Session.get('tag_filter');

            console.log('text.length: ' + text.length);
            if (text.length) {
                console.log('text: ' + text);
                console.log('list_id: ' + Session.get('list_id'));
                console.log('owner: ' + Meteor.userId());

                Meteor.call('createNewTask', {
                    text: text,
                    list_id: Session.get('list_id'),
                    done: false,
                    star: false,
                    timestamp: (new Date()).getTime(),
                    tags: tag ? [tag] : [],
                    owner: Meteor.userId,
                    tags: tag ? [tag] : [],
                    public: 'public'
                }, function (error, todo) {
                    console.log('error: ' + error);
                    console.log('todo: ' + todo);
                });
            } else {
                Session.set("createError",
                    "It needs a title and a description, or why bother?");
            }
            evt.target.value = '';
        },
        cancel: function(text,evt){
            $('#newTaskInput').addClass('lightgray');
            $('#newTaskInput').val('add new task');
        }
    })
);

//--------------------------------------------------------------------------
// New Task Input Bar

// TODO:  confirm if this is still being used; delete if not
Template.workqueueTemplate.any_list_selected = function () {
   try{
       if(Session.equals('list_id', undefined)){
           return false;
       }else{
           return !Session.equals('list_id', null);
       };
   }catch(err){

   }
};

// TODO:  refactor todos to taskList
Template.workqueueTemplate.todos = function () {
    // Determine which tasks to display in the taskList,
    // selected based on list_id and tag_filter.

    try{
        var list_id = Session.get('list_id');
        console.log('list_id:' + Session.get('list_id'));

        if (!list_id)
            return {};

        var selection = {list_id: list_id};
        var tag_filter = Session.get('tag_filter');
        if (tag_filter)
            selection.tags = tag_filter;

//        var sortCompleted = 0;
//        var sortStarred = 0;
//        var sortAlphabetically = 0;
//        var sortTimestamp = 0;

        var sortObject = {timestamp: 1};
        if(Session.get('sort_workqueues_completed')){
            sortObject = {done: 1};
        }
        if(Session.get('sort_workqueues_starred')){
            sortObject = {star: 1};
        }
        if(Session.get('sort_workqueues_alphabetically')){
            sortObject = {text: 1};
        }
        return Todos.find(selection, {sort: sortObject});

    }catch(error){
        console.log(error);
    }
};




//----------------------------------------------------------------------


Template.taskItemTemplate.showDeleteButton = function(){
  if(Session.get('selected_task_delete_id') == this._id){
      return true;
  }else{
      return false;
  }
};


Template.taskItemTemplate.tag_objs = function () {
    try{
        var todo_id = this._id;
        return _.map(this.tags || [], function (tag) {
            return {todo_id: todo_id, tag: tag};
        });
    }catch(error){
        console.log(error);
    }
};
Template.taskItemTemplate.adding_tag = function () {
    return Session.equals('editing_addtag', this._id);
};

Template.taskItemTemplate.done_class = function () {
    try{
        return this.done ? 'done' : '';
    }catch(error){
        console.log(error);
    }
};

Template.taskItemTemplate.task_complete = function () {
    try{
        return this.done ? 'green' : 'lightgray';
    }catch(error){
        console.log(error);
    }
};
Template.taskItemTemplate.task_text_complete = function () {
    try{
        return this.done ? 'strikeout' : '';
    }catch(error){
        console.log(error);
    }
};
Template.taskItemTemplate.task_star = function () {
    try{
        return this.star ? 'goldenrod' : 'lightgray';
    }catch(error){
        console.log(error);
    }
};
//Template.taskItemTemplate.done_checkbox = function () {
//    try{
//        return this.done ? 'green' : 'lightgray';
//    }catch(error){
//        console.log(error);
//    }
//};

Template.taskItemTemplate.editing = function () {
    return Session.equals('editing_itemname', this._id);
};



Template.taskItemTemplate.events({
    'touchstart .inline-list':function(eventHandler){
        Session.set('json_content', JSON.stringify(this));
        Session.set('swipe_start', eventHandler.touches[0].pageX);
        Meteor.flush();
    },
    'touchend .inline-list':function(eventHandler){
        //alert(Math.abs(Session.get('swipe_start') - eventHandler.pageX));
        //alert((Math.abs(Session.get('swipe_start') - eventHandler.pageX) > 100));

        if(Session.get('selected_task_delete_id') != null){
            Session.set('selected_task_delete_id', null);
        }else{
            if(Math.abs((Session.get('swipe_start') - eventHandler.pageX)) < 200){
                //alert(this._id);
                Session.set('selected_task_delete_id', this._id);
            }else{
                Session.set('selected_task_delete_id', null);
                Session.set('selected_task_id', this._id);
                Session.set('selected_task_done_status', this.done);
                Session.set('selected_task_text', this.text);
                Session.set('show_task_detail_panel', true);
                setTaskDetailVisibility();
            }
        }
        Meteor.flush();
    },
    'mousedown .todo': function(){
        Session.set('json_content', JSON.stringify(this));
    },


    'dblclick .todo': function(){
        //toggleTaskDetailPanel();
        Session.set('show_task_detail_panel', true);
        Meteor.flush();
    },
    'click .checkmark': function (e) {
        Todos.update(this._id, {$set: {done: !this.done}});
        e.preventDefault();
        Meteor.flush();
    },
    'click .task-star': function (e) {
        Todos.update(this._id, {$set: {star: !this.star}});
        e.preventDefault();
        Meteor.flush();
    },
    'click .task-info': function (e) {
        if(Session.get('show_task_detail_panel')){
            Session.set('show_task_detail_panel', false);
        }else{
            Session.set('show_task_detail_panel', true);
            Session.set('selected_task_id', this._id);
            Session.set('selected_task_done_status', this.done);
            Session.set('selected_task_text', this.text);
        }
        setTaskDetailVisibility();
        Meteor.flush();
    },
    'click .task-delete': function (e) {
        if(confirm('Are you sure you want to delete task ' + Session.get('selected_task_id') + '?')){
            Todos.remove(this._id);
            Meteor.flush();
        }
    },
    'click .delete-button': function () {
        Session.set('selected_task_delete_id', null);
        Todos.remove(this._id);
        Meteor.flush();
    },
    'click .addtag': function (evt, tmpl) {
        Session.set('editing_addtag', this._id);
        Meteor.flush(); // update DOM before focus
        activateInput(tmpl.find("#edittag-input"));
    },
    'dblclick .display .todo-text': function (evt, tmpl) {
        Session.set('editing_itemname', this._id);
        Meteor.flush(); // update DOM before focus
        activateInput(tmpl.find("#todo-input"));
        Meteor.flush();
    },
    'click .remove': function (evt) {
        var tag = this.tag;
        var id = this.todo_id;

        evt.target.parentNode.style.opacity = 0;
        // wait for CSS animation to finish
        Meteor.setTimeout(function () {
            Todos.update({_id: id}, {$pull: {tags: tag}});
        }, 300);
        Meteor.flush();
    }
});

Template.taskItemTemplate.events(okCancelEvents(
    '#todo-input',
    {
        ok: function (value) {
            Todos.update(this._id, {$set: {text: value}});
            Session.set('editing_itemname', null);
        },
        cancel: function () {
            Session.set('editing_itemname', null);
        }
    }));

Template.taskItemTemplate.events(okCancelEvents(
    '#edittag-input',
    {
        ok: function (value) {
            Todos.update(this._id, {$addToSet: {tags: value}});
            Session.set('editing_addtag', null);
        },
        cancel: function () {
            Session.set('editing_addtag', null);
        }
    }));


//----------------------------------------------------------------------------------

sendToActiveCollaborator = function() {
    try {
        //alert('sending to collaborator');
        // Meteor.user().profile breaks when user is logged out
        if (Meteor.user().profile) {
            //alert(Meteor.user().profile.activeCollaborator);
            Meteor.users.update(Meteor.user().profile.activeCollaborator, {$set:{ 'profile.dropbox':Session.get('selected_task_id')}});
        } else {
            log_event('Meteor profile not available.');
        }
    }
    catch (err) {
        catch_error("sendToActiveCollaborator()", err, LogLevel.Error, this);
    }
}



//----------------------------------------------------------------------
//----------------------------------------------------------------------
// TASK DETAIL CARD

Template.taskDetailCardTemplate.tag_list = function () {
    //console.log('*-----------------------------------------------------');
    //console.log('selected_task_id: ' + Session.get('selected_task_id'));

    try{
        //var todo_id = Session.get('selected_task_id');
        var selectedTodo = Todos.findOne(Session.get('selected_task_id'));
        //console.log('selectedTodo: ' + JSON.stringify(selectedTodo));
        return _.map(selectedTodo.tags || [], function (tag) {
            return {todo_id: Session.get('selected_task_id'), tag: tag};
        });
    }catch(error){
        console.log(error);
    }
};
Template.taskDetailCardTemplate.adding_detailed_tag = function () {
    return Session.equals('editing_detailed_addtag', Session.get('selected_task_id'));
};


Template.taskDetailCardTemplate.events({
    'click .task-detail-image-container': function(evt,tmpl){
        Session.set('is_modal_dialog', true);
        Session.set('pre_modal_sidebar_panel_state', Session.get('show_sidebar_panel'));
        Session.set('show_sidebar_panel',false);
        Session.set('pre_modal_page', '#workqueuesPage');
        showPage('#iconAssetsPage');
    },
    'click .send-to-collaborator':function(evt,tmpl){
        sendToActiveCollaborator();
    },
    'click #detailedTaskAddTagIcon': function (evt) {
        Session.set('editing_detailed_addtag', Session.get('selected_task_id'));
        Meteor.flush();

        $('#edittagInputDetailed').focus();
        $('#edittagInputDetailed').select();
    },
    'click .remove': function (evt) {
        var tag = this.tag;
        var id = this.todo_id;

        evt.target.parentNode.style.opacity = 0;
        // wait for CSS animation to finish
        Meteor.setTimeout(function () {
            Todos.update({_id: id}, {$pull: {tags: tag}});
        }, 300);
    },
    'click .card-header': function (evt, tmpl) {
        Session.set('show_task_detail_panel', false);
        setTaskDetailVisibility();
        Meteor.flush();
    },
    'click .card-delete-button': function(evt){
        if(confirm('Are you sure you want to delete task ' + Session.get('selected_task_id') + '?')){
            Session.set('show_task_detail_panel', false);
            setTaskDetailVisibility();
            Todos.remove(Session.get('selected_task_id'));
            Meteor.flush();
        }
    }
});
Template.taskDetailCardTemplate.events(okCancelEvents(
    '#edittagInputDetailed',
    {
        ok: function (value) {
            Todos.update(Session.get('selected_task_id'), {$addToSet: {tags: value}});
            Session.set('editing_detailed_addtag', null);
        },
        cancel: function () {
            Session.set('editing_detailed_addtag', null);
        }
}));



Template.taskDetailCardTemplate.rendered = function(){
    if(Session.get('show_sidebar_panel')){
        $('#taskDetailCardBody').css('width', window.innerWidth - 240);
        $('#taskDetailTagFooter').css('width', window.innerWidth - 240);
        $('.card-delete-button').css('right', 215);
    }else{
        $('#taskDetailCardBody').css('width', window.innerWidth - 40);
        $('#taskDetailTagFooter').css('width', window.innerWidth - 240);
        $('.card-delete-button').css('right', 21);
    }
    $("#taskDetailCard").bind("mousemove", function(e){
        e.preventDefault();
    });
    $("#taskDetailCard").bind("swipeleft", function(){
        sendToActiveCollaborator();
    });
    $("#taskDetailCard").bind("swiperight", function(){
        sendToActiveCollaborator();
    });
    $("#taskDetailCard").bind("swipeleftdown swipedown swiperightdown", function(){
        Session.set('show_task_detail_panel',false);
        Meteor.flush();
    });
};
Template.taskDetailCardTemplate.showTaskDetail = function(){
    return Session.get('show_task_detail_panel');
};
Template.taskDetailCardTemplate.showTaskDetailModalMask = function(){
    return true;
};
Template.taskDetailCardTemplate.todo_id = function(){
    return Session.get('selected_task_id');
};
Template.taskDetailCardTemplate.todo_text = function(){
    return Session.get('selected_task_text');
};
Template.taskDetailCardTemplate.todo_done = function(){
    return Session.get('selected_task_done_status') ? 'checked="checked"' : '';
};
Template.taskDetailCardTemplate.todo_image = function(){
    //Todos.findOne(Session.get('selected_task_id'), {$set: { image: this.image }});

    var foo = Todos.findOne(Session.get('selected_task_id'));
    if(foo.image){
        return foo.image;
    }else{
        return '/images/placeholder-240x240.gif';
    }
};
Template.taskDetailCardTemplate.tag_objs = function(){
    return _.map(this.tags || [], function (tag) {
        return {todo_id: ession.get('selected_task_id'), tag: tag};
    });
};
Template.taskDetailCardTemplate.adding_tag = function(){
    return false;
};




