$('.ui.dropdown')
  .dropdown();

function redirect(url) {
  console.log('haha')
  window.location.href = url
}



// Read more logics
$(".article-description p").each(function () {
  const lines = lineCounter($(this)[0])
  if (lines < 3) {
    $(this).next().hide()
  } else {
    $(this).addClass('block-with-text')
  }
})
function lineCounter(el) {
  var divHeight = el.offsetHeight
  var lineHeight = parseInt(window.getComputedStyle(el).getPropertyValue('line-height'))
  var lines = divHeight / lineHeight
  return lines
}
$(".article-description a").on('click', function (e) {
  if ($(this).text() === 'Read more...') {
    $(this).html('Close')
    $(this).prev().removeClass('block-with-text')
  } else {
    $(this).html('Read more...')
    $(this).prev().addClass('block-with-text')
  }
})



// Sort Dropdown change logics
$(".dropdown").dropdown({
  onChange: function (val) {
    console.log(val)
    $.ajax({
      url: `?sortby=${val}`,
      type: 'GET',
      success: function (res) {
        console.log(res)
        // redirect('/')
      },
      error: function () {
        console.log('error')
      }
    })
  }
})


// Add Feed URL
$('form').submit(function (e) {
  e.preventDefault()
  var url = $(this).serializeArray()[0].value
  $.ajax({
    url: '/addUrl',
    type: 'POST',
    data: { feedUrl: url },
    success: function (res) {
      console.log('refresh??')
      location.reload()
    },
    error: function (error) {
      alert(error.responseJSON.errMsg)
      $("form input").val("").focus()
    }
  })
})