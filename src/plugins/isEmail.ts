import merge from './util/merge'
import isByteLength from './isByteLength'
import isFQDN from './isFQDN'
import isIP from './isIP'

const defaultEmailOptions = {
	allowDisplayName: false,
	requireDisplayName: false,
	allowUtf8LocalPart: true,
	requireTld: true,
}

/* eslint-disable max-len */
/* eslint-disable no-control-regex */
const splitNameAddress = /^([^\x00-\x1F\x7F-\x9F\cX]+)<(.+)>$/i
const emailUserPart = /^[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~]+$/i
const gmailUserPart = /^[a-z\d]+$/
const quotedEmailUser = /^([\s\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e]|(\\[\x01-\x09\x0b\x0c\x0d-\x7f]))*$/i
const emailUserUtf8Part = /^[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+$/i
const quotedEmailUserUtf8 = /^([\s\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|(\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*$/i
const defaultMaxEmailLength = 254
/* eslint-enable max-len */
/* eslint-enable no-control-regex */

/**
 * Validate display name according to the RFC2822: https://tools.ietf.org/html/rfc2822#appendix-A.1.2
 * @param {String} displayName
 */
function validateDisplayName(displayName) {
	const trimQuotes = displayName.match(/^"(.+)"$/i)
	const displayNameWithoutQuotes = trimQuotes ? trimQuotes[1] : displayName

	// display name with only spaces is not valid
	if (!displayNameWithoutQuotes.trim()) {
		return false
	}

	// check whether display name contains illegal character
	const containsIllegal = /[\.";<>]/.test(displayNameWithoutQuotes)
	if (containsIllegal) {
		// if contains illegal characters,
		// must to be enclosed in double-quotes, otherwise it's not a valid display name
		if (!trimQuotes) {
			return false
		}

		// the quotes in display name must start with character symbol \
		const allStartWithBackSlash =
				displayNameWithoutQuotes.split('"').length === displayNameWithoutQuotes.split('\\"').length
		if (!allStartWithBackSlash) {
			return false
		}
	}

	return true
}


export default function isEmail(str, options) {
	options = merge(options, defaultEmailOptions)

	if (options.requireDisplayName || options.allowDisplayName) {
		const displayEmail = str.match(splitNameAddress)
		if (displayEmail) {
			let displayName
			[, displayName, str] = displayEmail
			// sometimes need to trim the last space to get the display name
			// because there may be a space between display name and email address
			// eg. myname <address@gmail.com>
			// the display name is `myname` instead of `myname `, so need to trim the last space
			if (displayName.endsWith(' ')) {
				displayName = displayName.substr(0, displayName.length - 1)
			}

			if (!validateDisplayName(displayName)) {
				return false
			}
		} else if (options.requireDisplayName) {
			return false
		}
	}
	if (!options.ignoreMaxLength && str.length > defaultMaxEmailLength) {
		return false
	}

	const parts = str.split('@')
	const domain = parts.pop()
	let user = parts.join('@')

	const lowerDomain = domain.toLowerCase()

	if (options.domainSpecificValidation && (lowerDomain === 'gmail.com' || lowerDomain === 'googlemail.com')) {
		/*
		  Previously we removed dots for gmail addresses before validating.
		  This was removed because it allows `multiple..dots@gmail.com`
		  to be reported as valid, but it is not.
		  Gmail only normalizes single dots, removing them from here is pointless,
		  should be done in normalizeEmail
		*/
		user = user.toLowerCase()

		// Removing sub-address from username before gmail validation
		const username = user.split('+')[0]

		// Dots are not included in gmail length restriction
		if (!isByteLength(username.replace('.', ''), { min: 6, max: 30 })) {
			return false
		}

		const userParts = username.split('.')
		for (let i = 0; i < userParts.length; i++) {
			if (!gmailUserPart.test(userParts[i])) {
				return false
			}
		}
	}

	if (!isByteLength(user, { max: 64 }) ||
			!isByteLength(domain, { max: 254 })) {
		return false
	}

	if (!isFQDN(domain, { requireTld: options.requireTld })) {
		if (!options.allowIpDomain) {
			return false
		}

		if (!isIP(domain)) {
			if (!domain.startsWith('[') || !domain.endsWith(']')) {
				return false
			}

			let noBracketdomain = domain.substr(1, domain.length - 2)

			if (noBracketdomain.length === 0 || !isIP(noBracketdomain)) {
				return false
			}
		}
	}

	if (user[0] === '"') {
		user = user.slice(1, user.length - 1)
		return options.allowUtf8LocalPart ?
				quotedEmailUserUtf8.test(user) :
				quotedEmailUser.test(user)
	}

	const pattern = options.allowUtf8LocalPart ?
			emailUserUtf8Part : emailUserPart

	const userParts = user.split('.')
	for (let i = 0; i < userParts.length; i++) {
		if (!pattern.test(userParts[i])) {
			return false
		}
	}

	return true
}
