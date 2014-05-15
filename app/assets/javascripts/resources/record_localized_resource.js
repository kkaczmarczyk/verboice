#= require resources/localized_resource

onResources(function(){
  window['RecordLocalizedResource']= function RecordLocalizedResource(hash, resource){
    LocalizedResource.call( this, hash, resource );

    this.label = 'Record message';
    this.template = 'record_localized_resource_template';

    this.hasAudio = ko.observable(hash.has_recorded_audio);
    this.recording = ko.observable(false);
    this.playing = ko.observable(false);
    this.duration = ko.observable(hash.duration || (new Date).clearTime().toString('mm:ss'));
    this.recordingStart = null;
    this.updateDurationInterval = null;
    this.description = ko.observable(hash.description);
    this.totalDuration = this.duration();
    this.listenersInitialized = false;

    this.isValid = ko.computed(function(){
      this.hasAudio();
    }, this)
  }

  RecordLocalizedResource.prototype = new LocalizedResource();
  RecordLocalizedResource.prototype.constructor = RecordLocalizedResource;

  RecordLocalizedResource.prototype.record= function(){
    var self = this;
    if (this.playing() || this.recording()) return;

    this.playing(false);
    this.updateDuration(0);

    var recorderElement = document.getElementById("recorder");
    recorderElement.record();

    this.initListeners(this, recorderElement);
    this.alertFlashRequired('recording');
  }

  RecordLocalizedResource.prototype.initListeners = function(currentResource, recorderElement){
    if(!this.listenersInitialized){
      window.currentResource = currentResource;
      recorderElement.addEventListener("recorderStart", "RecordLocalizedResource.prototype.startHandler");
      recorderElement.addEventListener("recorderComplete", "RecordLocalizedResource.prototype.completeHandler");
      recorderElement.addEventListener("playbackComplete", "RecordLocalizedResource.prototype.playbackCompleteHandler");
      this.listenersInitialized = true;
    }
  }

  RecordLocalizedResource.prototype.startHandler = function(info) {
    window.currentResource.recording(true);
    window.currentResource.recordingStart = window.currentResource.nowSeconds();
    window.timeHandler = window.setInterval( function(){ return window.currentResource.updateDuration(window.currentResource.nowSeconds() - window.currentResource.recordingStart)}, 500 );
  }

  RecordLocalizedResource.prototype.completeHandler = function(info) {
    clearInterval(window.timeHandler);
    window.currentResource.totalDuration = window.currentResource.convertSecondsToString(window.currentResource.nowSeconds() - window.currentResource.recordingStart);
    window.currentResource.recording(false);
    window.currentResource.hasAudio(true);
  }

  RecordLocalizedResource.prototype.playbackCompleteHandler = function(info) {
    window.currentResource.playing(false);
    clearInterval(window.currentResource.updateDurationInterval);
    window.currentResource.duration(window.currentResource.totalDuration);
  }


  RecordLocalizedResource.prototype.stop= function(){
    document.getElementById("recorder").stop();
    this.playing(false);
    clearInterval(this.updateDurationInterval);
    this.duration(this.totalDuration);
  }

  RecordLocalizedResource.prototype.toHash= function(){
    var recorder = document.getElementById("recorder");
    var resourceData = { description: this.description(), duration: this.duration()};
    if (recorder.hasData()) {
      resourceData["encoded_audio"] = recorder.data();
    }
    return $.extend(LocalizedResource.prototype.toHash.call( this ), resourceData);
  }

  RecordLocalizedResource.prototype.type= function(){
    return 'RecordLocalizedResource';
  }

  RecordLocalizedResource.prototype.play= function(){
    var recorder = document.getElementById("recorder");
    this.initListeners(this, recorder);
    if (this.playing() || this.recording() || (!this.hasAudio() && !recorder.hasData())) return;
    this.recording(false);
    this.playing(true);
    var self = this;
    this.playbackStart = this.nowSeconds();
    this.updateDuration(0);
    this.updateDurationInterval = window.setInterval( function(){ return self.updateDuration(self.nowSeconds() - self.playbackStart)}, 500 );

    if (recorder.hasData()) {
      recorder.play();
    } else {
      if (this.isSaved()) {
        recorder.play(this.playRecordingUrl());
      }
    }
    this.alertFlashRequired('playing');
  }

  RecordLocalizedResource.prototype.saveRecordingUrl= function(){
    return "/projects/" + project_id + "/resources/" + this.parent().id() + "/localized_resources/" + this.id() + "/save_recording";
  }

  RecordLocalizedResource.prototype.playRecordingUrl= function(){
    return "/projects/" + project_id + "/resources/" + this.parent().id() + "/localized_resources/" + this.id() + "/play_recording";
  }

  RecordLocalizedResource.prototype.nowSeconds= function(){
    return Math.round(new Date()/1000);
  }

  RecordLocalizedResource.prototype.updateDuration= function(seconds){
    return this.duration(this.convertSecondsToString(seconds));
  }

  RecordLocalizedResource.prototype.convertSecondsToString = function(seconds){
    return (new Date).clearTime().addSeconds(seconds).toString('mm:ss');
  }

  RecordLocalizedResource.prototype.alertFlashRequired= function(){
    if ($('.flash-required').length) {
      $('.flash-required').html('');
      alert("Adobe Flash Player version 10.0.0 or higher is required for " + action + " a message.\nDownload it from https://get.adobe.com/flashplayer/ and reload this page.");
    }
  }

  RecordLocalizedResource.prototype.preserveCurrentValues= function() {
    this.original_description = this.description();
    this.original_duration = this.duration();
  }

  RecordLocalizedResource.prototype.revertToPreservedValues= function() {
    this.description(this.original_description);
    var recorder = document.getElementById("recorder");
    this.duration(this.original_duration);
    this.totalDuration = this.duration();
    recorder.clear();
  }
})


