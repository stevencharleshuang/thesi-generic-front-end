/** Begin Logic */

document.addEventListener("DOMContentLoaded", function() {
  /**
    * @const {DOMNode}
    */
  const articleTemplate = document.querySelector('article');
  /**
    * @const {DOMNode}
    */
  const commentsTemplate = document.querySelector(".comments");

  const host = "http://thesi-ga.herokuapp.com";

  /**
    * @function populateProfile
    * @param {object} json - The profile's data
    */
  const populateProfile = (json) => {
    console.log(json)
    document.querySelector("#profile-username").innerHTML = json.user.username;
    document.querySelector("#profile-additional-email").value = json.additionalEmail;
    document.querySelector("#profile-address").value = json.address;
    document.querySelector("#profile-mobile").value = json.mobile;
  };

  /**
    * @function saveProfile
    */
  const saveProfile = () => {
    const data = {
      additionalEmail: document.querySelector("#profile-additional-email").value,
      address: document.querySelector("#profile-address").value,
      mobile: document.querySelector("#profile-mobile").value
    }

    fetch(`${host}/profile`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.localStorage.getItem("token")}`
        }
      })
      .then(data => {
        if (data.status === 200) {
          return data.json();
        }
        throw new Error("Unable to update Profile. Are you still logged in?");
      })
      .then(json => {
        alert("Successfully Updated Profile.");
      })
      .catch(error => {
        alert(error);
      });
  };

  /**
    * @function logIn
    * @param {string} jwt - The token created by /login or from localstorage
    * @throws {Error} if unable to retrieve profile from jwt
    * @see getPosts()
    * @return null
    */

  const logIn = (jwt) => {
    document.querySelector("#sign-in-button").classList.add("hidden");
    document.querySelector("#sign-up-button").classList.add("hidden");
    document.querySelector("#sign-in").classList.add("hidden");
    document.querySelector("#sign-out-button").classList.remove("hidden");
    document.querySelector("#post-button").classList.remove("hidden");
    document.querySelector("#profile-button").classList.remove("hidden");

    window.localStorage.setItem("token", jwt);

    /** Get the username from the profile */
    fetch(`${host}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      }
    })
    .then(data => {
      if (data.status === 200) {
        return data.json();
      }
      throw new Error("Unable to get profile. Are you still logged in?");
    })
    .then(json => {
      window.localStorage.setItem("username", json.user.username);
      document.querySelector("#profile-button").innerHTML = `Hello, ${json.user.username}.`;
      populateProfile(json);
      getPosts();
    })
    .catch(error => {
      alert(error);
    });
  }

  /**
    * @function logOut
    * Performs cleanup actions after logout.
    * @return null
    */

  const logOut = () => {
    document.querySelector("#sign-in-button").classList.remove("hidden");
    document.querySelector("#sign-up-button").classList.remove("hidden");
    document.querySelector("#sign-out-button").classList.add("hidden");
    document.querySelector("#post-button").classList.add("hidden");
    document.querySelector("#profile-button").classList.add("hidden");

    window.localStorage.removeItem("token");
    window.localStorage.removeItem("username");
  }

  /**
    * @function postComment
    * @param {string} id - The id of the post upon which to place the comment
    * @throws {Error} if token is expired, missing, or malformed
    * @see getPosts()
    * @return null
    */

  const postComment = (id) => {
    const data = {
      text: document.querySelector(`#${id} textarea`).value
    }

    const postID = id.replace('post-','');
    fetch(`${host}/comment/${postID}`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      })
      .then(data => {
        if (data.status === 200) {
          return data.json();
        }
        throw new Error("Unable to comment. Are you still logged in?");
      })
      .then(json => {
        getPosts();
      })
      .catch(error => {
        alert(error);
      });
  };

  /**
    * @function deleteComment
    * @param {number} id - The id of the comment to delete
    * @throws {Error} if user is not logged in or otherwise cannot be authorized
    * @return null
    */

  const deleteComment = (id) => {
    fetch(`${host}/comment/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.localStorage.getItem("token")}`
        }
      })
      .then(data => {
        if (data.status === 200) {
          return data.json();
        }
        throw new Error("Unable to delete. Are you still logged in and the author of the comment?");
      })
      .then(json => {
        getPosts();
      })
      .catch(error => {
        alert(error);
      })
  };

  /**
    * @function deletePost
    * @param {string} id - The id of the comment to delete
    * @throws {Error} if user is not logged in or otherwise cannot be authorized
    * @return null
    * @see getPosts()
    */

  const deletePost = (id) => {
    const postID = id.replace('post-','');
    fetch(`${host}/post/${postID}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      })
      .then(data => {
        if (data.status === 200) {
          return data;
        }
        throw new Error("Unable to delete. Are you still logged in and the author of the post?");
      })
      .then(json => {
        getPosts();
      })
      .catch(error => {
        alert(error);
      })
  };

  /**
    * @function post
    * @throws {Error} if user is not logged in or otherwise cannot be authorized
    * @return null
    * @see getPosts()
    */

  const post = () => {
    const data = {
      title: document.querySelector("#post-title").value,
      description: document.querySelector("#post-content").value
    };

    fetch(`${host}/post`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.localStorage.getItem("token")}`
        }
      })
      .then(data => {
        if (data.status === 200) {
          return data.json();
        }
        throw new Error("Unable to post. Are you still logged in?");
      })
      .then(json => {
        document.querySelector("#post").classList.add("hidden");
        document.querySelector(".background").classList.add("hidden");
        getPosts();

        document.querySelector("#post-title").value = "";
        document.querySelector("#post-content").value = "";
      })
      .catch(error => {
        alert(error);
      })
  };

  /**
    * @function getPosts
    * Gets all posts and their associated comments
    * @throws {Error} if posts cannot be retrieved
    * @return null
    */
  const getPosts = () => {
    fetch(`${host}/post/list`)
      .then(data => {
        return data.json();
      })
      .then(json => {
        const posts = document.querySelector("#posts");

        while (posts.hasChildNodes()) {
          posts.removeChild(posts.lastChild);
        }

        json.reverse();

        json.forEach(post => {
          fetch(`${host}/post/${post.id}/comment`)
            .then(data => {
              if (data.status === 200) {
                return data.json();
              }
              throw new Error("Unable to retrieve posts");
            })
            .then(comments => {
              const article = articleTemplate.cloneNode('deep');
              article.id = `post-${post.id}`;
              article.dataset.author = post.user.username;
              article.querySelector(".title").innerHTML = post.title;
              article.querySelector(".body").innerHTML = post.description;
              article.querySelector(".author").innerHTML = post.user.username;

              if (post.user.username === window.localStorage.getItem("username")) {
                article.querySelector(".author-container .button").classList.remove("hidden");
              }
              article.classList.remove("hidden");

              const articleComments = article.querySelector(".comments-container");

              if (comments.length > 0) {
                articleComments.classList.remove("hidden");

                comments.forEach(c => {
                  const comment = commentsTemplate.cloneNode('deep');
                  comment.id = `comment-${c.id}`;
                  comment.dataset.author = c.user.username;
                  comment.querySelector(".body").innerHTML = c.text;
                  comment.querySelector(".comment-author").innerHTML = c.user.username;

                  if (c.user.username === window.localStorage.getItem("username")) {
                    comment.querySelector(".comment-delete").classList.remove("hidden")
                  }
                  comment.classList.remove("hidden");
                  articleComments.appendChild(comment);
                })
              }

              document.querySelector("#posts").appendChild(article);
            })
          .catch(error => {
            alert(error)
          })
        })
      })
  };

  /** on pageload */
  getPosts();

  /** if a jwt exists. @see logIn() */
  if (window.localStorage.getItem('token') !== "null") {
    logIn(window.localStorage.getItem('token'));
  }

  /**
    * Click handler for header's sign in button
    * @see logIn()
    * @throw {Error} if invalid login
    */
  document.querySelector("#sign-in .button").addEventListener("click", (e) => {
    e.preventDefault();

    const data = {
      email: document.querySelector("#signinEmail").value,
      password: document.querySelector("#signinPassword").value
    };

    fetch(`${host}/login`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      .then(data => {
        if (data.status === 200) {
          return data.json();
        }
        document.querySelector("#sign-in .error").classList.remove("hidden");
        throw new Error("Invalid Login");
      })
      .then(json => {
        jwt = json.token;
        document.querySelector(".background").classList.add("hidden");
        document.querySelector("#sign-in .error").classList.add("hidden");

        logIn(jwt);
      })
      .catch(error => {
        console.log(error)
      })
  });

  /**
    * Click handler for header's sign up button
    * @throws {Error} if sign up rejected
    */

  document.querySelector("#sign-up .button").addEventListener("click", (e) => {
    e.preventDefault();

    const data = {
      username: document.querySelector("#inputUsername").value,
      email: document.querySelector("#inputEmail").value,
      password: document.querySelector("#inputPassword").value
    };

    fetch(`${host}/signup`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      .then(data => {
        if (data.ok) {
          return data.json();
        } else {
          throw Error('rejected');
        }
      })
      .then(json => {
        jwt = json.token;

        fetch(`${host}/profile`, {
          method: 'POST',
          body: JSON.stringify({}),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          }
        })
          .then(data => {
            if (data.status === 200) {
              return data.json();
            }
            throw new Error("Could not create user.");
          })
          .then(() => {
            logIn(jwt);
            document.querySelector(".background").classList.add("hidden");
            document.querySelector("#sign-up").classList.add("hidden");
          })
          .catch(error => {
            alert(error);
          })
      })
      .catch(e => {
        alert(e);
      })
  });

  /**
    * Event-delegated click handler for header's buttons to toggle modal overrlay, excluding sign out
    */

  document.querySelector("nav").addEventListener("click", (e) => {
    const bg = document.querySelector(".background");

    if (e.target.classList.contains("action") && e.target.id !== "sign-out-button") {
      if (bg.classList.contains("hidden")) {
        bg.classList.remove("hidden");
      } else {
        bg.classList.add("hidden");
      }
    }
  })

  /**
    * Click handler for header's sign in button's visual logic
    */
  document.querySelector("#sign-in-button").addEventListener("click", (e) => {
    e.preventDefault();
    const signInButton = document.querySelector("#sign-in");
    if (signInButton.classList.contains("hidden")) {
      signInButton.classList.remove("hidden");
    } else {
      signInButton.classList.add("hidden");
    }
  });

  /**
    * Click handler for header's sign up button's visual logic
    */
  document.querySelector("#sign-up-button").addEventListener("click", (e) => {
    e.preventDefault();
    const signUpButton = document.querySelector("#sign-up");
    if (signUpButton.classList.contains("hidden")) {
      signUpButton.classList.remove("hidden");
    } else {
      signUpButton.classList.add("hidden");
    }
  });

  /**
    * Click handler for header's sign out button
    * @see logOut()
    * @see getPosts()
    */
  document.querySelector("#sign-out-button").addEventListener("click", (e) => {
    e.preventDefault();
    logOut();
    getPosts();
  });

  /**
    * Event-delegated click handler for modal close button's visual logic
    */
  document.querySelector(".background").addEventListener("click", (e) => {
    if (e.target.classList.contains("close")) {
      document.querySelector(".background").classList.add("hidden");
      e.target.parentNode.classList.add("hidden");
    }
  })

  /**
    * Click handler for header's post button's visual logic
    */
  document.querySelector("#post-button").addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector("#post").classList.remove("hidden");
  });

  /**
    * Click handler for post modal
    * @see post()
    */
  document.querySelector("#post .button").addEventListener("click", (e) => {
    e.preventDefault();
    post();
  });

  /**
    * Event-delegated click handler for deleting a post or posting a comment
    * @see deletePost()
    * @see postComment()
    */
  document.querySelector("#posts").addEventListener("click", (e) => {
    e.preventDefault();
    if (e.target.classList.contains("delete-post")) {
      const id = e.target.parentNode.parentNode.id;
      deletePost(id);
    }

    if (e.target.classList.contains("add-comment")) {
      const id = e.target.parentNode.parentNode.id;
      postComment(id);
    }
  });

  /**
    * Event-delegated click handler for deleting comments
    * @see deleteComment()
    */
  document.querySelector("#posts").addEventListener("click", (e) => {
    e.preventDefault();
    if (e.target.classList.contains("delete-comment")) {
      const id = e.target.parentNode.parentNode.id;
      deleteComment(id);
    }
  });

  /**
    * Click handler profile button
    */
  document.querySelector("#profile-button").addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector("#profile").classList.remove("hidden");
  });

  /**
    * Click handler update profile
    */
  document.querySelector("#profile a.button").addEventListener("click", (e) => {
    e.preventDefault();
    saveProfile();
  });
});
