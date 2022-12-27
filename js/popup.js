$(document).ready(function(){
    console.log(66666666666666666666666)
    var recording = false;
    
    // 设置自定义下拉列表
    $("#camera-select").niceSelect();
    $("#mic-select").niceSelect();
    
    // 获取默认设置(由用户设置)
    chrome.storage.sync.get(null, function(result) {
        console.log(result)
        if (!result.toolbar) {
            $("#persistent").prop("checked", true);  
        }
        if (result.flip) {
            $("#flip").prop("checked", true);  
        }
        if (result.pushtotalk) {
            $("#push").prop("checked", true);  
        }
        if (result.countdown) {
            $("#countdown").prop("checked", true);  
        }
        if (result.countdown_time != 3) {
            $("#countdown-time").html(result.countdown_time + " ");
        }
        if (result.quality == "max") {
            $("#quality").html(chrome.i18n.getMessage("smaller_file_size"));
        } else {
            $("#quality").html(chrome.i18n.getMessage("highest_quality"))
        }
        if (result.fps == "60") {
            $("#fps").html("30FPS video");
        } else {
            $("#fps").html("60FPS video")
        }
        if ($(".type-active").attr("id") == "tab-only") {
           $(".type-active").find("img").attr("src", chrome.extension.getURL('./assets/images/popup/tab-only.svg'));
        } else if ($(".type-active").attr("id") == "desktop") {
           $(".type-active").find("img").attr("src", chrome.extension.getURL('./assets/images/popup/desktop.svg'));
        } else if ($(".type-active").attr("id") == "camera-only") {
           $(".type-active").find("img").attr("src", chrome.extension.getURL('./assets/images/popup/camera-only.svg'));
        }
        $(".type-active").removeClass("type-active");
        $("#"+result.type).addClass("type-active");
        if ($("#"+result.type).attr("id") == "tab-only") {
           $("#"+result.type).find("img").attr("src", chrome.extension.getURL('./assets/images/popup/tab-only-active.svg'));
        } else if ($("#"+result.type).attr("id") == "desktop") {
           $("#"+result.type).find("img").attr("src", chrome.extension.getURL('./assets/images/popup/desktop-active.svg'));
        } else if ($("#"+result.type).attr("id") == "camera-only") {
           $("#"+result.type).find("img").attr("src", chrome.extension.getURL('./assets/images/popup/camera-only-active.svg'));
        }
    });
    
    // 开始记录
    function record(){
        if (!recording) {
            chrome.runtime.sendMessage({type: "record"});
            $("#record").html(chrome.i18n.getMessage("starting_recording"));
        } else {
            recording = false;
            $("#record").html(chrome.i18n.getMessage("start_recording"));
            chrome.runtime.sendMessage({type: "stop-save"}); 
            window.close();
        }
    }
    
    // 请求扩展音频访问，如果网站拒绝(背景)
    function audioRequest() {
        navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
           var audiodevices = [];
            navigator.mediaDevices.enumerateDevices().then(function(devices) {
              devices.forEach(function(device) {
                  if (device.kind == "audioinput") {
                      audiodevices.push({label:device.label, id:device.deviceId});
                  }
              }); 
              getAudio(audiodevices);
            });
        }).catch(function(error){
            $("#mic-select").html("<option value='disabled'>"+chrome.i18n.getMessage("disabled_allow_access")+"</option>");
        });
    }
    
    
    // 获得可用的音频设备
    function getAudio(audio) {
        $("#mic-select").html("<option value='disabled'>"+chrome.i18n.getMessage("disabled")+"</option>");
        audio.forEach(function(device) {
            if (device.label == "Disabled") {
                $("#mic-select").append("<option value='"+device.id+"'>"+chrome.i18n.getMessage("disabled")+"</option>");
            } else {
                $("#mic-select").append("<option value='"+device.id+"'>"+device.label+"</option>");   
            }
        });
        $("#mic-select").niceSelect('update');
        chrome.storage.sync.get(['mic'], function(result) {
            if (result.mic != 0) {
                $('#mic-select').val(result.mic).niceSelect('update');
            } else {
                $('#mic-select').val($("#mic-select option:nth-child(2)").val()).niceSelect('update');
                chrome.runtime.sendMessage({type: "update-mic", id:$("#mic-select").val()});
            }
        });
    }
    
    // 获取可用的摄像设备
    function getCamera(camera) {
        $("#camera-select").html("<option value='disabled'>"+chrome.i18n.getMessage("disabled")+"</option>");
        camera.forEach(function(device) {
            if (device.label == "Disabled") {
                $("#camera-select").append("<option value='"+device.id+"'>"+chrome.i18n.getMessage("disabled")+"</option>");
            } else {
                $("#camera-select").append("<option value='"+device.id+"'>"+device.label+"</option>");   
            }
        });
        $("#camera-select").niceSelect('update');
        chrome.storage.sync.get(['camera'], function(result) {
            if (result.camera != 0 && result.camera != "disabled-access") {
                $('#camera-select').val(result.camera).niceSelect('update');
                if ($(".type-active").attr("id") == "camera-only" && $("#camera-select").val() == "disabled") {
                    $("#record").addClass("record-disabled");
                } else {
                    $("#record").removeClass("record-disabled");
                }
            } else {
                $('#camera-select').val($("#camera-select option:nth-child(2)").val()).niceSelect('update');
                chrome.runtime.sendMessage({type: "update-camera", id:$("#camera-select").val()});
            }
        });
    }
    
    // Get available camera devices 获取可用的摄像设备
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendMessage(tab.id, {
            type: "camera-request"
        });
    });
    
    // Check if recording is ongoing 检查录音是否正在进行
    chrome.runtime.sendMessage({type: "record-request"}, function(response){
        recording = response.recording;
        if (response.recording) {
            $("#record").html(chrome.i18n.getMessage("stop_recording"));
            $("#record").addClass("record-stop");
        }
    });
    
    // 检查当前选项卡是否无法记录
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        if (tabs[0].url.includes("chrome://") || tabs[0].url.includes("chrome-extension://") || tabs[0].url.includes("chrome.com") || tabs[0].url.includes("chrome.google.com")) {
            $("#record").addClass("record-disabled");
            $("#record").html(chrome.i18n.getMessage("cannot_record"));
        }
    });
    
    // Modify settings 修改设置
    $("#flip").on("change", function(){
        chrome.storage.sync.set({flip: this.checked});
        chrome.runtime.sendMessage({type: "flip-camera", enabled:this.checked});
    });
    $("#push").on("change", function(){
        chrome.storage.sync.set({pushtotalk: this.checked});
        chrome.runtime.sendMessage({type: "push-to-talk", enabled:this.checked});
    });
    $("#countdown").on("change", function(){
        chrome.storage.sync.set({countdown: this.checked});
    });
    $("#persistent").on("change", function(){
        chrome.storage.sync.set({toolbar: !this.checked});
        chrome.runtime.sendMessage({type: "switch-toolbar", enabled:!this.checked});
    });
    $("#camera-select").on("change", function(){
        chrome.runtime.sendMessage({type: "update-camera", id:$("#camera-select").val()});
        if ($(".type-active").attr("id") == "camera-only" && ($("#camera-select").val() == "disabled" || $("#camera-select").val() == "disabled-access")) {
            $("#record").addClass("record-disabled");
        } else {
            $("#record").removeClass("record-disabled");
        }
    });
    $("#mic-select").on("change", function(){
        chrome.runtime.sendMessage({type: "update-mic", id:$("#mic-select").val()});
    });
    
    // Change recording area 改变记录区
    $(document).on("click", ".type:not(.type-active)", function(){
        debugger
       if ($(".type-active").attr("id") == "tab-only") {
           $(".type-active").find("img").attr("src", chrome.extension.getURL('./assets/images/popup/tab-only.svg'));
       } else if ($(".type-active").attr("id") == "desktop") {
           $(".type-active").find("img").attr("src", chrome.extension.getURL('./assets/images/popup/desktop.svg'));
       } else if ($(".type-active").attr("id") == "camera-only") {
           $(".type-active").find("img").attr("src", chrome.extension.getURL('./assets/images/popup/camera-only.svg'));
       }
       $(".type-active").removeClass("type-active");
       $(this).addClass("type-active");
        if ($(".type-active").attr("id") == "camera-only" && ($("#camera-select").val() == "disabled" || $("#camera-select").val() == "disabled-access")) {
            $("#record").addClass("record-disabled");
        } else {
            $("#record").removeClass("record-disabled");
        }
       if ($(this).attr("id") == "tab-only") {
           $(this).find("img").attr("src", chrome.extension.getURL('./assets/images/popup/tab-only-active.svg'));
       } else if ($(this).attr("id") == "desktop") {
           $(this).find("img").attr("src", chrome.extension.getURL('./assets/images/popup/desktop-active.svg'));
       } else if ($(this).attr("id") == "camera-only") {
           $(this).find("img").attr("src", chrome.extension.getURL('./assets/images/popup/camera-only-active.svg'));
       }
        chrome.runtime.sendMessage({type: "recording-type", recording:$(".type-active").attr("id")});
        chrome.storage.sync.set({type:$(".type-active").attr("id")});
    });
    
    // Start recording 开始记录
    $("#record").on("click", function(){
        record();
    });
    
    // Show more dropdown 显示更多下拉
    $("#more").on("click", function(e){
        if ($("#more-select").hasClass("countactive")) {
            $("#more-select").removeClass("countactive");
        } else {
            $("#more-select").addClass("countactive");
        }
    });
    
    // Show awards overlay (temporary event) 显示奖项叠加(临时事件)
    $("#awards").on("click", function(e){
        if ($("#awards-open").hasClass("countactive")) {
            $("#awards-open").removeClass("countactive");
        } else {
            $("#awards-open").addClass("countactive");
        }
    });
    
    // Show countdown dropdown 显示倒计时下拉
    $("#count-select").on("click", function(e){
        e.preventDefault(); 
        if ($("#countdown-select").hasClass("countactive")) {
            $("#countdown-select").removeClass("countactive");
        } else {
            $("#countdown-select").addClass("countactive");
        }
    });
    
    // Change countdown time 倒计时时间改变
    $(".countdown").on("click", function(){
        $("#count-select").html($(this).html().slice(0, -1));
        chrome.storage.sync.set({countdown_time: parseInt($(this).html().slice(0, -1))});
        $("#countdown-select").removeClass("countactive");
    })
    
    // Hide countdown dropdown when clicking anywhere but the dropdown
    // 隐藏倒计时下拉，当点击任何地方，但下拉
    $(document).on("click", function(e){
        if (!$("#countdown-select").is(e.target) && $("#countdown-select").has(e.target).length === 0 && !$("#count-select").is(e.target) && $("#count-select").has(e.target).length === 0) {
            $("#countdown-select").removeClass("countactive");
        }
        if (!$("#more-select").is(e.target) && $("#more-select").has(e.target).length === 0 && !$("#more").is(e.target) && $("#more").has(e.target).length === 0) {
            $("#more-select").removeClass("countactive");
        }
        if (!$("#awards-open").is(e.target) && $("#awards-open").has(e.target).length === 0 && !$("#awards").is(e.target) && $("#awards").has(e.target).length === 0) {
            $("#awards-open").removeClass("countactive");
        }
    })
    
    // Go to the shortcuts page in Chrome (workaround, chrome:// links are a local resource so they can't be triggered via a normal link)
    // 转到快捷键页面在Chrome(工作区，Chrome://链接是一个本地资源，所以他们不能通过正常的链接触发)
    $("#shortcuts").on("click", function(e){
        chrome.tabs.create({
             url: "chrome://extensions/shortcuts"
        });
    })
    
    // Higher quality or smaller file size for the recording
    // 更高的质量或更小的文件大小的录音
    $("#quality").on("click", function(e){
        chrome.storage.sync.get(['quality'], function(result) {
            if (result.quality == "max") {
                chrome.storage.sync.set({
                    quality: "min"
                });
                $("#quality").html(chrome.i18n.getMessage("highest_quality"));
            } else {
                chrome.storage.sync.set({
                    quality: "max"
                });
                $("#quality").html(chrome.i18n.getMessage("smaller_file_size"));
            }
        });
    });
    
    // Higher or lower FPS for the recording
    // 更高或更低的FPS记录
    $("#fps").on("click", function(e){
        chrome.storage.sync.get(['fps'], function(result) {
            if (result.fps == "60") {
                chrome.storage.sync.set({
                    fps: "30"
                });
                $("#fps").html("60FPS video");
            } else {
                chrome.storage.sync.set({
                    fps: "60"
                });
                $("#fps").html("30FPS video");
            }
        });
    });
    
    // Receive messages
    // 接收消息
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.type == "loaded") {
            window.close();
        } else if (request.type == "sources") {
            getCamera(request.devices);
            
            // Allow user to start recording
            // 允许用户开始录音
            if (!recording) {
                $("#record").html(chrome.i18n.getMessage("start_recording"));
            }
            $("#record").removeClass("record-disabled");
        } else if (request.type == "sources-audio") {
            getAudio(request.devices);
            
            // Allow user to start recording
            if (!recording) {
                $("#record").html(chrome.i18n.getMessage("start_recording"));
            }
            $("#record").removeClass("record-disabled");
        } else if (request.type == "sources-noaccess") {
            $("#camera-select").html("<option value='disabled-access'>"+chrome.i18n.getMessage("disabled_allow_access")+"</option>");
            $("#camera-select").niceSelect('update');
            chrome.storage.sync.set({
                camera: "disabled-access"
            });
            
            // Allow user to start recording
            if (!recording) {
                $("#record").html(chrome.i18n.getMessage("start_recording"));
            }
            if ($(".type-active").attr("id") != "camera-only") {
                $("#record").removeClass("record-disabled");
            }
        } else if (request.type == "sources-loaded") {
            chrome.tabs.getSelected(null, function(tab) {
                chrome.tabs.sendMessage(tab.id, {
                    type: "camera-request"
                });
            });
        } else if (request.type == "sources-audio-noaccess") {
            audioRequest();   
        }
    });
    
    // Localization (strings in different languages)
    // 本地化(不同语言中的字符串)
    $("#camera-select").html("<option value='disabled'>"+chrome.i18n.getMessage("disabled")+"</option>");
    $("#mic-select").html("<option value='disabled'>"+chrome.i18n.getMessage("disabled")+"</option>");
    $("#mic-select").niceSelect('update');
    $("#camera-select").niceSelect('update');
    $("#shortcuts").html(chrome.i18n.getMessage("keyboard_shortcuts"));
    $("#quality").html(chrome.i18n.getMessage("smaller_file_size"));
    $("#rateextension").html(chrome.i18n.getMessage("rate_extension"));
    $("#madeby").html(chrome.i18n.getMessage("made_by_alyssa"));
    $("#tab-only p").html(chrome.i18n.getMessage("tab_only"));
    $("#desktop p").html(chrome.i18n.getMessage("desktop"));
    $("#camera-only p").html(chrome.i18n.getMessage("camera_only"));
    $("#camera-select-label").html(chrome.i18n.getMessage("camera"));
    $("#flip-label").html(chrome.i18n.getMessage("flip_camera"));
    $("#mic-label").html(chrome.i18n.getMessage("microphone"));
    $("#push-label").html(chrome.i18n.getMessage("push_to_talk"));
    $("#second-label").html(chrome.i18n.getMessage("second"));
    $(".seconds-label").html(chrome.i18n.getMessage("seconds"));
    $("#countdown-label").html(chrome.i18n.getMessage("countdown"));
    $("#hover-label").html(chrome.i18n.getMessage("only_on_hover"));
    $("#record").html(chrome.i18n.getMessage("loading"));
});
