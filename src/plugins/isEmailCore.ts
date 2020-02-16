//cloned from validator
const isByteLength = (str: string, {min = 0, max}: {min?: number, max: number}) => {
	const len = encodeURI(str).split(/%..|./).length - 1
	return len >= min && (typeof max === 'undefined' || len <= max)
}

const isFQDN = (str: string, options?: {
	requireTld?: boolean
	allowUnderscores?: boolean
	allowTrailingDot?: boolean
}) => {
	options = {
		requireTld: true,
		allowUnderscores: false,
		allowTrailingDot: false,
		...options
	}

	/* Remove the optional trailing dot before checking validity */
	if (options.allowTrailingDot && str[str.length - 1] === '.') str = str.substring(0, str.length - 1)
	const parts = str.split('.')
	for (const part of parts) if (part.length > 63) return false
	if (options.requireTld) {
		const tld = parts.pop()
		if (tld === undefined) return false
		if (!parts.length || !/^([a-z\u00a1-\uffff]{2,}|xn[a-z0-9-]{2,})$/i.test(tld)) return false
		// disallow spaces
		if (/[\s\u2002-\u200B\u202F\u205F\u3000\uFEFF\uDB40\uDC20]/.test(tld)) return false
	}
	for (let part, i = 0; i < parts.length; i++) {
		part = parts[i]
		if (options.allowUnderscores) part = part.replace(/_/g, '')
		if (!/^[a-z\u00a1-\uffff0-9-]+$/i.test(part)) return false
		// disallow full-width chars
		if (/[\uff01-\uff5e]/.test(part)) return false
		if (part[0] === '-' || part[part.length - 1] === '-') return false
	}
	return true
}
const ipv4Maybe = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/
const ipv6Block = /^[0-9A-F]{1,4}$/i

const isIP = (str: string, version: string | number = ''): boolean => {
	version = String(version)
	if (!version) return isIP(str, 4) || isIP(str, 6)
	else if (version === '4') {
		if (!ipv4Maybe.test(str)) return false
		const parts = str.split('.').map(x => parseInt(x)).sort((a, b) => a - b)
		return parts[3] <= 255
	} else if (version === '6') {
		let addressAndZone = [str]
		// ipv6 addresses could have scoped architecture
		// according to https://tools.ietf.org/html/rfc4007#section-11
		if (str.includes('%')) {
			addressAndZone = str.split('%')
			// it must be just two parts
			if (addressAndZone.length !== 2) return false
			// the first part must be the address
			if (!addressAndZone[0].includes(':')) return false

				// the second part must not be empty
			if (addressAndZone[1] === '') return false
		}

		const blocks = addressAndZone[0].split(':')
		let foundOmissionBlock = false // marker to indicate ::

		// At least some OS accept the last 32 bits of an IPv6 address
		// (i.e. 2 of the blocks) in IPv4 notation, and RFC 3493 says
		// that '::ffff:a.b.c.d' is valid for IPv4-mapped IPv6 addresses,
		// and '::a.b.c.d' is deprecated, but also valid.
		const foundIPv4TransitionBlock = isIP(blocks[blocks.length - 1], 4)
		const expectedNumberOfBlocks = foundIPv4TransitionBlock ? 7 : 8

		if (blocks.length > expectedNumberOfBlocks) return false
		// initial or final ::
		if (str === '::') return true
		else if (str.substr(0, 2) === '::') {
			blocks.shift()
			blocks.shift()
			foundOmissionBlock = true
		} else if (str.substr(str.length - 2) === '::') {
			blocks.pop()
			blocks.pop()
			foundOmissionBlock = true
		}

		for (let i = 0; i < blocks.length; ++i) {
			// test for a :: which can not be at the string start/end
			// since those cases have been handled above
			if (blocks[i] === '' && i > 0 && i < blocks.length - 1) {
				if (foundOmissionBlock) return false // multiple :: in address
				foundOmissionBlock = true
			} else if (foundIPv4TransitionBlock && i === blocks.length - 1) {
				// it has been checked before that the last
				// block is a valid IPv4 address
			} else if (!ipv6Block.test(blocks[i])) return false
		}
		if (foundOmissionBlock) return blocks.length >= 1
		return blocks.length === expectedNumberOfBlocks
	}
	return false
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
const validateDisplayName = (displayName: string) => {
	const trimQuotes = displayName.match(/^"(.+)"$/i)
	const displayNameWithoutQuotes = trimQuotes ? trimQuotes[1] : displayName

	// display name with only spaces is not valid
	if (!displayNameWithoutQuotes.trim()) return false

	// check whether display name contains illegal character
	const containsIllegal = /[\.";<>]/.test(displayNameWithoutQuotes)
	if (containsIllegal) {
		// if contains illegal characters,
		// must to be enclosed in double-quotes, otherwise it's not a valid display name
		if (!trimQuotes) return false

		// the quotes in display name must start with character symbol \
		const allStartWithBackSlash =
				displayNameWithoutQuotes.split('"').length === displayNameWithoutQuotes.split('\\"').length
		if (!allStartWithBackSlash) return false
	}

	return true
}


export interface IIsEmailOptions {
	allowDisplayName?: boolean
	requireDisplayName?: boolean
	allowUtf8LocalPart?: boolean
	requireTld?: boolean
	ignoreMaxLength?: boolean
	domainSpecificValidation?: boolean
	allowIpDomain?: boolean
}
export default (str: string, options?: IIsEmailOptions) => {
	options = {
		allowDisplayName: false,
		requireDisplayName: false,
		allowUtf8LocalPart: true,
		requireTld: true,
		...options
	}

	if (options.requireDisplayName || options.allowDisplayName) {
		const displayEmail = str.match(splitNameAddress)
		if (displayEmail) {
			let displayName
			[, displayName, str] = displayEmail
			// sometimes need to trim the last space to get the display name
			// because there may be a space between display name and email address
			// eg. myname <address@gmail.com>
			// the display name is `myname` instead of `myname `, so need to trim the last space
			if (displayName.endsWith(' ')) displayName = displayName.substr(0, displayName.length - 1)

			if (!validateDisplayName(displayName)) return false
		} else if (options.requireDisplayName) return false
	}
	if (!options.ignoreMaxLength && str.length > defaultMaxEmailLength) return false

	const parts = str.split('@')
	const domain = parts.pop() || ''
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
		for (const userPart of userParts) if (!gmailUserPart.test(userPart)) return false
	}

	if (!isByteLength(user, { max: 64 }) || !isByteLength(domain, { max: 254 })) return false

	if (!isFQDN(domain, { requireTld: options.requireTld })) {
		if (!options.allowIpDomain) return false

		if (!isIP(domain)) {
			if (!domain.startsWith('[') || !domain.endsWith(']')) return false

			const noBracketDomain = domain.substr(1, domain.length - 2)

			if (noBracketDomain.length === 0 || !isIP(noBracketDomain)) return false
		}
	}

	if (user[0] === '"') {
		user = user.slice(1, user.length - 1)
		return options.allowUtf8LocalPart ? quotedEmailUserUtf8.test(user) : quotedEmailUser.test(user)
	}

	const pattern = options.allowUtf8LocalPart ? emailUserUtf8Part : emailUserPart

	const userParts = user.split('.')
	for (const userPart of userParts) if (!pattern.test(userPart)) return false

	return true
}
