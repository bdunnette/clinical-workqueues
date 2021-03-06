//--------------------------------------------------------------------------
// Layout Helper Functions


// this is the main workhorse function that is responsible for actually rendering
// the workqueues page correctly; it gets called on render, resize, orientation change,
// and a few other situations.

layoutWorkqueuesPage = function() {
    console.log('layoutworkquesPage();');

    if (window.innerWidth > 767) {
        if (Session.get('show_sidebar_panel')) {
            $('#mainLayoutPane').css('width', window.innerWidth - 195);
            $('.card-body-resize').css('width', window.innerWidth - 235);
            $('.card-footer-resize').css('width', window.innerWidth - 235);
            $('.web-link-controls').css('width', window.innerWidth - 500);
            $('.detailed-task-card-controls').css('right', 217);
        } else {
            $('#mainLayoutPane').css('width', window.innerWidth);
            $('.card-body-resize').css('width', window.innerWidth - 40);
            $('.card-footer-resize').css('width', window.innerWidth - 40);
            $('.web-link-controls').css('width', window.innerWidth - 260);
            $('.detailed-task-card-controls').css('right', 21);
        }
    } else if (window.innerWidth < 767) {
        $('#mainLayoutPane').css('width', window.innerWidth);
        $('.card-body-resize').css('width', window.innerWidth - 40);
        $('.card-footer-resize').css('width', window.innerWidth - 40);
        $('.web-link-controls').css('width', window.innerWidth - 260);
        $('.detailed-task-card-controls').css('right', 21);
    } else if (window.innerWidth < 480) {
        $('#mainLayoutPane').css('width', window.innerWidth);
        $('.card-body-resize').css('width', window.innerWidth - 40);
        $('.card-footer-resize').css('width', window.innerWidth - 40);
        $('.web-link-controls').css('width', window.innerWidth - 260);
        $('.detailed-task-card-controls').css('right', 21);
    }
};


//--------------------------------------------------------------------------
// Workqueues Templates

Template.workqueuesPageTemplate.rendered = function(){
    try{
        console.log('Template.workqueuesPageTemplate.rendered');
        layoutWorkqueuesPage();
    }catch(err){
        console.log(err);
    }
};


// the secret sauce for getting an app to resize correctly is to use a Monad
// note how we begin with a template variable that we want to calculate
// and how the reactive session variable is defined last
Template.workqueuesPageTemplate.resized = function(){
    try{
        setSidebarVisibility();
        layoutWorkqueuesPage();
        return Session.get("resized");
    }catch(err){
        console.log(err);
    }
};

// TODO:  move dropboxAlert from workqueueTemplate to workqueuesPageTemplate
Template.workqueuesPageTemplate.receivedNewAlert = function(){
    try{
//        if(Meteor.user().profile.dropbox == undefined){
//            return false;
//        }else if(Meteor.user().profile.dropbox == ""){
//            return false;
//        }else {
//            console.log("profile.dropbox:  " + JSON.stringify(Meteor.user().profile.dropbox));
//            return true;
//        }
        return monitorDropbox();
    }
    catch(err){
        console.log(err);
    }
};


//--------------------------------------------------------------------------
// New Task Input Bar

Template.workqueuesPageTemplate.events({
    'click #newTaskInput': function(evt,tmpl){
        try{
            if($('#newTaskInput').val() === 'add new task'){
                $('#newTaskInput').removeClass('lightgray');
                $('#newTaskInput').val('');
            }
        }catch(err){
            console.log(err);
        }
    }
});
Template.workqueuesPageTemplate.events(okCancelEvents(
    '#newTaskInput',
    {
        ok: function (text, evt) {
            try{
                console.log('ok called on new todo item');
                var tag = Session.get('tag_filter');

                console.log('text.length: ' + text.length);
                if (text.length) {
                    console.log('text: ' + text);
//                    console.log('list_id: ' + Session.get('list_id'));
                    console.log('owner: ' + Meteor.userId());

                    Meteor.call('createNewTask', {
                        text: text,
                        done: false,
                        star: false,
                        timestamp: (new Date()).getTime(),
                        owner: Meteor.userId(),
                        tags: tag ? [tag] : []
                    }, function (error, todo) {
                        console.log('error: ' + error);
                        console.log('todo: ' + todo);
                    });
                } else {
                    Session.set("createError",
                        "It needs a title and a description, or why bother?");
                }
                evt.target.value = '';
            }catch(err){
                console.log(err);
            }
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
       }
   }catch(err){

   }
};

// TODO:  refactor todos to taskList
Template.workqueueTemplate.todos = function () {
    // Determine which tasks to display in the taskList,
    // selected based on list_id and tag_filter.

    try{
        var selectionQuery = {owner: Meteor.userId()};

        if (Session.get('tag_filter')){
            selectionQuery.tags = Session.get('tag_filter');
        }

        var sortSettings = {timestamp: 1};
        if(Session.get('sort_workqueues_completed')){
            sortSettings = {done: 1};
        }
        if(Session.get('sort_workqueues_starred')){
            sortSettings = {star: 1};
        }
        if(Session.get('sort_workqueues_alphabetically')){
            sortSettings = {text: 1};
        }

        switch(Session.get('selected_list')){
            case "all":
                console.log('selected list - all');
                return Todos.find(selectionQuery, {sort: sortSettings});
                break;
            case "urgent":
                console.log('selected list - urgent');
                selectionQuery.star = true;
                return Todos.find(selectionQuery, {sort: sortSettings});
                break;
            case "routine":
                console.log('selected list - routine');
                selectionQuery.star = false;
                return Todos.find(selectionQuery, {sort: sortSettings});
                break;
            case "finished":
                console.log('selected list - finished');
                selectionQuery.done = true;
                return Todos.find(selectionQuery, {sort: sortSettings});
                break;
            case "unfinished":
                console.log('selected list - unfinished');
                selectionQuery.done = false;
                return Todos.find(selectionQuery, {sort: sortSettings});
                break;
//            case "today":
//                console.log('selected list - today');
//                return Todos.find({owner: Meteor.userId()}, {sort: sortSettings});
//                return Todos.find(selectionQuery, {sort: sortSettings});
//                break;
//            case "inbox":
//                console.log('selected list - inbox');
//                return Todos.find({owner: Meteor.userId()}, {sort: sortSettings});
//                return Todos.find(selectionQuery, {sort: sortSettings});
//                break;
            default:
                break;
        }

    }catch(error){
        console.log(error);
    }
};

Template.workqueueTemplate.showTaskDetail = function(){
    try{
        return Session.get('show_task_detail_panel');
    }catch(error){
        console.log(error);
    }
};



//----------------------------------------------------------------------


Template.taskItemTemplate.showDeleteButton = function(){
    try{
        if(Session.get('selected_task_delete_id') === this._id){
            return true;
        }else{
            return false;
        }
    }catch(error){
        console.log(error);
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
    try{
        return Session.equals('editing_addtag', this._id);
    }catch(err){
        console.log(err);
    }
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

Template.taskItemTemplate.editing = function () {
    try{
        return Session.equals('editing_itemname', this._id);
    }catch(error){
        console.log(error);
    }
};



Template.taskItemTemplate.events({
    'touchstart .inline-list':function(eventHandler){
        Session.set('json_content', JSON.stringify(this));
        Session.set('swipe_start', eventHandler.touches[0].pageX);
        Meteor.flush();
    },
    'touchend .inline-list':function(eventHandler){
        // might be some useful syntax in the future
        //alert(Math.abs(Session.get('swipe_start') - eventHandler.pageX));
        //alert((Math.abs(Session.get('swipe_start') - eventHandler.pageX) > 100));

        if(Session.get('selected_task_delete_id') !== null){
            Session.set('selected_task_delete_id', null);
        }else{
            // if swiperight
            if(Math.abs((Session.get('swipe_start') - eventHandler.pageX)) < 200){
                //alert(this._id);
                Session.set('selected_task_delete_id', this._id);
            }else{
                Session.set('selected_task_delete_id', null);
//                Session.set('selected_task_id', this._id);
//                Session.set('selected_task_done_status', this.done);
//                Session.set('selected_task_text', this.text);
//                Session.set('show_task_detail_panel', true);
//                setTaskDetailVisibility();
            }
        }
        Meteor.flush();
    },
//    'mousedown .todo': function(){
//        Session.set('json_content', JSON.stringify(this));
//    },


//    'dblclick .todo': function(){
//        //toggleTaskDetailPanel();
//        Session.set('show_task_detail_panel', true);
//        Meteor.flush();
//    },
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
            Session.set('selected_task_star_status', this.star);
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
        if (Meteor.user().profile && Meteor.user().profile.activeCollaborator) {
            Meteor.users.update(Meteor.user().profile.activeCollaborator, {$set:{ 'profile.dropbox':Session.get('selected_task_id')}});
            //TODO:  log_hipaa_event() on callback

            log_hipaa_event("Sent task " + Session.get('selected_task_id') + " to " + Meteor.users.findOne(Meteor.user().profile.activeCollaborator).profile.name + " (" + Meteor.user().profile.activeCollaborator + " ).", LogLevel.Hipaa, Meteor.user()._id);

        } else {
            console.log('Meteor profile not available.');
        }
    }
    catch (err) {
        console.log(err);
    }
};



//----------------------------------------------------------------------
//----------------------------------------------------------------------
// TASK DETAIL CARD


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
    $(".task-detail-card-body").bind("mousemove", function(e){
        e.preventDefault();
    });
    $(".detailed-task-text").bind("mousemove", function(e){
        e.preventDefault();
    });
    $(".card-header").bind("mousemove", function(e){
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


Template.taskDetailCardTemplate.tag_list = function () {
    try{
        var selectedTodo = Todos.findOne(Session.get('selected_task_id'));
        return _.map(selectedTodo.tags || [], function (tag) {
            return {todo_id: Session.get('selected_task_id'), tag: tag};
        });
    }catch(error){
        console.log(error);
    }
};
Template.taskDetailCardTemplate.adding_detailed_tag = function () {
    try{
        return Session.equals('editing_detailed_addtag', Session.get('selected_task_id'));
    }catch(error){
        console.log(error);
    }
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
        Session.set('show_task_detail_panel', false);
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
    'click .task-detail-checkmark': function (e) {
        Todos.update(Session.get('selected_task_id'), {$set: {done: !Todos.findOne(Session.get('selected_task_id')).done}});
        e.preventDefault();
        Meteor.flush();
    },
    'click .task-detail-star': function (e) {
        Todos.update(Session.get('selected_task_id'), {$set: {star: !Todos.findOne(Session.get('selected_task_id')).star}});
        e.preventDefault();
        Meteor.flush();
    },
    'click .task-detail-send': function(e){
        sendToActiveCollaborator();
        Session.set('show_task_detail_panel', false);
    },
    'tap .task-detail-send': function(e){
        sendToActiveCollaborator();
        Session.set('show_task_detail_panel', false);
    },
    'click .task-detail-delete': function (e) {
        if(confirm('Are you sure you want to delete task ' + Session.get('selected_task_id') + '?')){
            Session.set('show_task_detail_panel', false);
            setTaskDetailVisibility();
            Todos.remove(Session.get('selected_task_id'));
            Meteor.flush();
        }
    },
    'click .card-header': function (evt, tmpl) {
        Session.set('show_task_detail_panel', false);
        setTaskDetailVisibility();
        Meteor.flush();
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





Template.taskDetailAnchorTemplate.showTaskDetailModalMask = function(){
    try{
        return true;
    }catch(error){
        console.log(error);
    }
};
Template.taskDetailCardTemplate.todo_id = function(){
    try{
        return Session.get('selected_task_id');
    }catch(error){
        console.log(error);
    }
};
Template.taskDetailCardTemplate.todo_text = function(){
    try{
        return Session.get('selected_task_text');
    }catch(error){
        console.log(error);
    }
};
Template.taskDetailCardTemplate.todo_done = function(){
    try{
        return Session.get('selected_task_done_status') ? 'checked="checked"' : '';
    }catch(error){
        console.log(error);
    }
};

Template.taskDetailCardTemplate.detailed_task_complete = function () {
    try{
        return Todos.findOne(Session.get('selected_task_id')).done ? 'green' : 'dimgray';
    }catch(error){
        console.log(error);
    }
};
Template.taskDetailCardTemplate.detailed_task_text_complete = function () {
    try{
        return Todos.findOne(Session.get('selected_task_id')).done ? 'strikeout' : '';
    }catch(error){
        console.log(error);
    }
};
Template.taskDetailCardTemplate.detailed_task_star = function () {
    try{
        return Todos.findOne(Session.get('selected_task_id')).star ? 'goldenrod' : 'dimgray';
    }catch(error){
        console.log(error);
    }
};
Template.taskDetailCardTemplate.activeCollaboratorName = function(){
    try{
        if(Meteor.user().profile.activeCollaborator){
            return Meteor.users.findOne(Meteor.user().profile.activeCollaborator).profile.name;
        }else{
            return " --- ";
        }
    }catch(error){
        console.log(error);
    }
};


Template.taskDetailCardTemplate.todo_image = function(){
    try{
        if(Todos.findOne(Session.get('selected_task_id')).image){
            return Todos.findOne(Session.get('selected_task_id')).image;
        }else{
            return '/images/click-to-select-task-image.jpg';
        }
    }catch(error){
        console.log(error);
    }
};
Template.taskDetailCardTemplate.tag_objs = function(){
    try{
        return _.map(this.tags || [], function (tag) {
            return {todo_id: Session.get('selected_task_id'), tag: tag};
        });
    }catch(error){
        console.log(error);
    }
};
Template.taskDetailCardTemplate.adding_tag = function(){
    try{
        return false;
    }catch(error){
        console.log(error);
    }
};


