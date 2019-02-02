$(document).ready(function(){
  $('.delete-book').on('click', function(e){
    $target = $(e.target);
    const id = $target.attr('data-id');
    $.ajax({
      type:'DELETE',
      url: '/books/'+id,
      success: function(response){
        alert('Book Deleted');
        window.location.href='/';
      },
      error: function(err){
        console.log(err);
      }
    });
  });
});
