$(document).ready(function(){

  function toggleNewBill() {
    $(".new-bills").toggle();
    $("a.new-bill").toggle();
  }

  $(".new-bills").toggle()
    .after("<a class='new-bill'>Add a new bill</a>")
    .before("<div id='result'></div>").hide();

  $("a.new-bill").click(function(event){
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