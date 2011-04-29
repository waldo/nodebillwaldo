$(document).ready(function(){

  function toggleNewBill() {
    $(".new-bills").toggle();
    $(".new-bill").toggle();
  }

  $(".new-bills").hide()
    .after("<div class='new-bill'><a>Add a new bill</a></div>");

  $("div.new-bill").click(function(event){
    toggleNewBill();
  });
  
  $('form#bill').submit(function() {
    event.preventDefault(); 

    var $form = $(this);
    var term = $form.find(':input').serializeArray();
    var url = $form.attr('action');

    $.post(url, term, function(data) {
      $("#description, #amount").val("");
      toggleNewBill();
      $("#bills").append(data);
    });
  });
});