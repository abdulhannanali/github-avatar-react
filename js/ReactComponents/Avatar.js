var app = {}

app.AvatarForm = React.createClass({
	getInitialState: function () {
		return {
			username: ""
		}
	},
	handleUsernameChange: function (event) {
		this.setState({
			username: event.target.value
		})
	},
	handleSubmit: function (event) {
		event.preventDefault()
		this.props.onFormSubmit(this.state.username)
		this.setState({
			username: ""
		})
	},
	render: function () {
		return (
			<form onSubmit={this.handleSubmit}>
				<input type="text" name="username" value={this.state.username} onChange={this.handleUsernameChange}/>
				<input type="submit" value="Search for username" />
			</form>
		)
	}
})

app.AvatarImage = React.createClass({
	render: function () {
		var imgSrc;
		var avatarEndpoint = "https://avatars1.githubusercontent.com/u/*?v=3&s=460"


		if (this.props.userId) {
			imgSrc = avatarEndpoint.replace("*", this.props.userId.split("-")[1])
			
			return (
				<img src={imgSrc} alt="avatar image" className="avatarImage" />
			)
		}
		else {
			return false
		}
		

	}
})


// Component for Avatar Name
// This component can be totally merged with AvatarDetials
app.AvatarName = React.createClass({
	render: function () {
		return (
				<h2>{this.props.name}</h2>
			)
	}
})


app.AvatarFavorite = React.createClass({
	handleClick: function () {
		this.props.handleStarFavorite()
	},
	render: function () {
		var favorite = this.props.favorite

		if (typeof this.props.favorite == "boolean") {
			var star;
			if (favorite) {
				star = (<i onClick={this.handleClick} className="material-icons" style={{color: "yellow"}}>star</i>)
			}
			else {
				star = (<i onClick={this.handleClick} className="material-icons" style={{color: "yellow"}}>star_border</i>)
			}

			return star
		}
		else {
			return false
		}
	} 
})


app.AvatarDetails = React.createClass({
	render: function () {
		var link = "https://github.com/*"

		if (this.props.details && !_.isEmpty(this.props.details)) {
			var details = this.props.details
			link = link.replace("*", details.username)
			return (
				<div className="avatarDetails">
					<h1 className="reposCount">Repos: {details.repos}</h1>
					<p>Profile Link: <a className="profileLink" href={link}>{link}</a></p>
				</div>
				)
		}
		else {
			return false
		}
	}
})

app.AvatarError = React.createClass({
	getInitialState: function () {
		return {
			displayTime: 5 // time in seconds
		}
	},
	render: function () {
		var message = ""

		if (this.props.errorCode == 404) {
			message = "The avatar with this username was not found in our database"
		}
		else if (this.props.errorCode == 500) {
			message = "An unexpected error occured while searching for this username"
		}
		else if (this.props.errorCode == 403) {
			message = "You are forbidden from the Github servers. Thank you!"
		}

		if (message) {
			return (
				<div className="errorAvatar">
					{message}
				</div>
			)	
		}
		else {
			return false
		}
		
	}
})


app.Avatar = React.createClass({
	getInitialState: function () {
		return {
			name: "",
			userId: "",
			username: "",
			reposCount: 0,
			errorCode: 0,
			favorite: undefined,
			favoriteUsers: {},
			data: {},
			favorites: store.get("favorites") || {}
		}
	},
	componentDidMount: function () {
		this.fetchUserSubmit("tj")
	},
	toggleFavorite: function () {
		var favorite = !this.state.favorite

		this.setState({
			favorite: favorite
		})

		var favorites = this.state.favorites

		if (favorite) {
			favorites[this.state.username] = this.state.data
		}
		else {
			delete favorites[this.state.username]
		}

		this.setState({
			favorites: favorites
		})

		store.set("favorites", favorites)
		console.log(favorites)
	},
	fetchUserSubmit: function (user) {
		var self = this
		if (!user || !user.trim()) {
			return;
		}

		var apiEndpoint = "https://api.github.com/legacy/user/search/*"
		fetch(apiEndpoint.replace("*", user))
			.then(function (response, body) {
				if (response.status == 500 || response.status == 404) {
					self.setState({
						errorCode: 500
					})
				}
				else if (response.status == 403) {
					self.setState({
						errorCode: 403
					})
				}
				else if (response.status == 200) {
					return response.json()					
				}
			})
			.then(function (data) {
				if (data && data.users && data.users[0]) {
					var user = data.users[0]
					self.setState({
						username: user.username,
						name: user.name,
						userId: user.id,
						reposCount: user.repos,
						errorCode: 0,
						data: user,
						favorite: self.state.favorites[user.username] ? true: false
					})

				}
				else {
					self.setState({
						errorCode: 404
					})
				}
			})
	},
	render: function () {
		return (
				<div className="avatarForm">
					<app.AvatarForm onFormSubmit={this.fetchUserSubmit} />
					<app.AvatarError errorCode={this.state.errorCode} />
					<app.AvatarName name={this.state.name} />
					<app.AvatarFavorite handleStarFavorite={this.toggleFavorite} favorite={this.state.favorite} />
					<app.AvatarDetails details={this.state.data} />
					<app.AvatarImage userId={this.state.userId} />
					<app.FavoriteUsers favorites={this.state.favorites} />
				</div>
			)
	}
})

app.FavoriteUsers = React.createClass({
	handleUserClick: function (event) {

	},
	render: function () {
		var users = Object.keys(this.props.favorites)
		var self = this

		var favoriteUsers = users.map(function (value, index, array) {
			var userData = self.props.favorites[value]
			var userId = parseInt(userData["id"].split("-")[1])
			return (
					<div>
						<a href={"https://github.com/" + userData.username}><div onClick={self.handleUserClick} key={userId} className="favoriteUser">{userData.username}</div></a>
						<p>Repos: {userData.repos}</p>
					</div>
				)
		})

		return (
				<div className="favoriteUsers">
					<h3>The favorite users</h3>
					{favoriteUsers}
				</div>
			)
	}
})


ReactDOM.render(<app.Avatar />,
				document.getElementById("container"))