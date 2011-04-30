(function() {
  $(document).ready(function() {
    var toggleNewBill;
    toggleNewBill = function() {
      $(".new-bills").toggle();
      return $(".new-bill").toggle();
    };
    $(".new-bills").hide().after("<div class='new-bill'><a>Add a new bill</a></div>");
    $("div.new-bill").click(function(event) {
      return toggleNewBill();
    });
    return $("form.bill").submit(function() {
      var $form, term, url;
      event.preventDefault();
      $form = $(this);
      term = $form.find(":input").serializeArray();
      url = $form.attr("action");
      return $.post(url, term, function(data) {
        $("#description, #amount").val("");
        return $("#bills").append(data);
      });
    });
  });
}).call(this);
