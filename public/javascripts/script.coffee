$(document).ready () ->
  toggleNewBill = ->
    $(".new-bills").toggle();
    $(".new-bill").toggle();

  $(".new-bills").hide().after("<div class='new-bill'><a>Add a new bill</a></div>")

  $("div.new-bill").click (event) ->
    toggleNewBill()
  
  $("form.bill").submit () ->
    event.preventDefault()

    $form = $(this)
    term = $form.find(":input").serializeArray()
    url = $form.attr("action")

    $.post url, term, (data) ->
      $("#description, #amount").val("")
      $("#bills").append(data)