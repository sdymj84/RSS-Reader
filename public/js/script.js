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
    $(".article-loader").addClass("active")
    $.ajax({
      url: '/sortby',
      type: 'POST',
      data: { sortby: val },
      success: function (res) {
        location.reload()
      },
      error: function (error) {
        alert(error.responseJSON.errMsg)
        $(".article-loader").removeClass("active")
      }
    })
  }
})

// Sort order change
$(".sort-order input").on('click', function () {
  var isChecked = $(this).is(':checked')
  $(".article-loader").addClass("active")
  // Order descend
  $.ajax({
    url: '/order',
    type: 'POST',
    data: { order: isChecked },
    success: function (res) {
      location.reload()
    },
    error: function (error) {
      alert(error.responseJSON.errMsg)
      $(".article-loader").removeClass("active")
    }
  })
})



// Add Feed URL
$('form.add-url').submit(function (e) {
  e.preventDefault()
  $(".article-loader").addClass("active")
  var url = $(this).serializeArray()[0].value
  console.log('subbmitted')
  $.ajax({
    url: '/addUrl',
    type: 'POST',
    data: { feedUrl: url },
    success: function (res) {
      location.reload()
    },
    error: function (error) {
      alert(error.responseJSON.errMsg)
      $(".article-loader").removeClass("active")
      $("form.add-url input").val("").focus()
    }
  })
})



// Remove Feed URL
$(".feed-url .button").on('click', function () {
  $(".article-loader").addClass("active")
  var url = $(this).prev().text().trim()
  $.ajax({
    url: '/removeUrl',
    type: 'POST',
    data: { feedUrl: url },
    success: function (res) {
      location.reload()
    },
    error: function (error) {
      alert(error.responseJSON.errMsg)
      $(".article-loader").removeClass("active")
    }
  })
})


// Sign In
$("form.signin").submit(function (e) {
  e.preventDefault()
  var inputs = $(this).serializeArray()
  var user = {}
  inputs.forEach(input => {
    user[input.name] = input.value
  })

  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(function (user) {
      window.location.replace('/')
    })
    .catch(function (error) {
      var errorCode = error.code
      var errorMessage = error.message
      console.log({ errorCode, errorMessage })
      alert(errorCode + ': ' + errorMessage)
      switch (errorCode) {
        case 'auth/user-not-found':
          $('form.signin input').val('')
          $('form.signin input:first').focus()
          break;
        case 'auth/wrong-password':
          $('form.signin input:last').val('').focus()
          break;
        default:
          break;
      }
    })
})

// Sign Up
$("form.signup").submit(function (e) {
  e.preventDefault()
  alert('sign up')
})

// Sign out
function signout() {
  firebase.auth().signOut().then(function () {
    console.log('Signed out successfully')
    $.ajax({
      url: '/signout',
      type: 'POST',
      data: {},
      error: function (error) {
        console.error(error)
      }
    })
    window.location.replace('/signin')
  }).catch(function (error) {
    console.error('Error on sign out', error)
  })
}


firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    console.log('Welcome', user.email)
    $.ajax({
      url: '/signin',
      type: 'POST',
      data: { uid: user.uid },
      error: function (error) {
        console.error(error)
      }
    })
    $('.nav-signin').addClass('hide')
    $('.nav-signout').removeClass('hide')

  } else {
    console.log('User is signed out.')
    $('.nav-signin').removeClass('hide')
    $('.nav-signout').addClass('hide')
  }
})