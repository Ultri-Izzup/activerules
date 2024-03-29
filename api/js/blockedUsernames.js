// Platform specific banned username
const internal = [
  "ultri",
  "izzup",
  "sharedchain",
  "etownmall",
  "usevue"
]

// Common list from this source:
// https://github.com/Ultri-Izzup/reserved-email-addresses-list/blob/master/index.json
const common = [
"24x7help",               "about",            "abuse",
"access",                 "account",          "accounting",
"accounts",               "activate",         "activities",
"activity",               "added",            "address",
"admin",                  "admini",           "administracion",
"administration",         "administrator",    "admissions",
"adobeemea",              "adult",            "advertise",
"advertising",            "advisor",          "affiliate",
"affiliates",             "album",            "albums",
"alert",                  "alerts",           "alpha",
"analysis",               "analytics",        "android",
"announcement",           "announcements",    "anonymous",
"answers",                "anti-spam",        "antispam",
"apple",                  "arabic",           "archive",
"archived",               "archives",         "asset",
"authentication",         "autoconfig",       "automailer",
"automatic",              "autoresponder",    "available",
"avatar",                 "awadhi",           "azerbaijani",
"backup",                 "backups",          "banner",
"banners",                "beintouch",        "bengali",
"bhojpuri",               "billing",          "blobs",
"blogs",                  "board",            "boletins",
"bookmark",               "bookmarked",       "bookmarks",
"bottom",                 "bounce",           "bounce-notification",
"bounce-notifications",   "bounces",          "broadcasthost",
"browse",                 "build",            "builds",
"built",                  "bulletin",         "bulletins",
"burmese",                "bursar",           "busdev",
"business",               "cache",            "cadastro",
"calendar",               "callback",         "campaign",
"cancel",                 "captcha",          "career",
"careers",                "categories",       "category",
"center",                 "cgi-bin",          "changelog",
"check",                  "checking",         "checkout",
"checkpoint",             "chinese",          "classic",
"client",                 "cliente",          "clients",
"cloud",                  "cname",            "co-op",
"codereview",             "comercial",        "comment",
"comments",               "communities",      "community",
"company",                "compare",          "compete",
"compliance",             "compras",          "concierge",
"config",                 "configuration",    "configure",
"connect",                "conserje",         "consultant",
"contabilidad",           "contact",          "contact-us",
"contact_us",             "contacto",         "contacts",
"contactus",              "contato",          "contest",
"contribute",             "control",          "convert",
"copied",                 "copyright",        "courier",
"crash",                  "create",           "crypt",
"customer",               "customer-care",    "customer-service",
"customer.care",          "customer.service", "customercare",
"customerservice",        "daemon",           "dashboard",
"database",               "decliend",         "decline",
"declined",               "default",          "delete",
"deleted",                "delivery",         "demos",
"denied",                 "deploy",           "deployed",
"deploys",                "design",           "designer",
"destroy",                "devel",            "developer",
"developers",             "development",      "devnull",
"digsitesvalue",          "direct_messages",  "director",
"directors",              "directory",        "dns-admin",
"dns-operation",          "dns.admin",        "dns.operation",
"dnsadmin",               "dnsoperation",     "do-not-reply",
"do-not-respond",         "do.not.reply",     "docker",
"document",               "documentation",    "documents",
"docusign",               "docusing",         "domain",
"domains",                "donotreply",       "donotrespond",
"dont-reply",             "dovecot",          "download",
"downloaded",             "downloads",        "dutch",
"e-bounce",               "e-invoice",        "e-mail",
"ebounce",                "ecommerce",        "edited",
"editor",                 "editorial",        "editors",
"edits",                  "einvoice",         "email",
"emails",                 "emailus",          "employment",
"empty",                  "english",          "enquire",
"enquiries",              "enquiry",          "enterprise",
"entries",                "entry",            "erase",
"erased",                 "error",            "errors",
"event",                  "events",           "everyone",
"example",                "examples",         "executive",
"executives",             "expert",           "experts",
"expire",                 "expired",          "explore",
"export",                 "exported",         "exports",
"facebook",               "family-safety",    "family.safety",
"familysafety",           "farmacia",         "farsi",
"favorite",               "favorites",        "feature",
"features",               "feedback",         "feeds",
"fetch",                  "files",            "finance",
"firewall",               "first",            "flagged",
"flags",                  "fleet",            "fleets",
"follow",                 "followers",        "following",
"forbidden",              "forgot",           "forgot-password",
"forgot_password",        "forgotpassword",   "forum",
"forums",                 "french",           "friend",
"friends",                "gadget",           "gadgets",
"games",                  "general",          "german",
"getanswer",              "gifts",            "github",
"google",                 "graph",            "group",
"groups",                 "groupupdates",     "guest",
"guests",                 "guide",            "guidelines",
"gujarati",               "hakka",            "hausa",
"head.office",            "headoffice",       "headteacher",
"hello",                  "help-desk",        "help.desk",
"helpdesk",               "hidden",           "hindi",
"history",                "homepage",         "hooks",
"host-master",            "host-name",        "host.master",
"host.name",              "hosting",          "hostmaster",
"hostname",               "howdy",            "howto",
"http2",                  "httpd",            "https",
"iana-admin",             "iana-tech",        "iana.admin",
"iana.tech",              "ianaadmin",        "ianatech",
"ideas",                  "image",            "images",
"import",                 "imported",         "imports",
"imulus",                 "inbox",            "index",
"indice",                 "information",      "informativo",
"inquiries",              "inquiry",          "inquirys",
"internal",               "intranet",         "intro",
"investorrelations",      "invitations",      "invite",
"invites",                "iphone",           "isatap",
"ispfeedback",            "ispsupport",       "issue",
"issues",                 "italian",          "items",
"japanese",               "javanese",         "javascript",
"jinyu",                  "kannada",          "keyserver",
"knowledgebase",          "korean",           "language",
"languages",              "lawyer",           "lawyers",
"legacy",                 "legal",            "license",
"liked",                  "likes",            "linked",
"links",                  "list-request",     "list-sender",
"list.request",           "listgroup",        "listrequest",
"lists",                  "listsender",       "listserv",
"local",                  "local-domain",     "local-host",
"local.domain",           "local.host",       "localdomain",
"localhost",              "locked",           "log-in",
"log-out",                "log_in",           "log_out",
"logged",                 "login",            "logout",
"logwatch",               "macos",            "macosx",
"magazine",               "mail-daemon",      "mail-deamon",
"mail.daemon",            "mail1",            "mail2",
"mail3",                  "mail4",            "mail5",
"mailbox",                "maildaemon",       "mailer",
"mailer-daemon",          "mailer.daemon",    "mailerdaemon",
"mailing",                "mailus",           "maintenance",
"maithili",               "majordomo",        "malayalam",
"manage",                 "manager",          "managers",
"mandarin",               "manual",           "marathi",
"market",                 "marketing",        "marketplace",
"markets",                "master",           "media",
"media-relations",        "media.relations",  "mediarelations",
"member",                 "members",          "memory",
"mentions",               "message",          "messages",
"messenger",              "microblog",        "microblogs",
"migrate",                "migrator",         "min-nan",
"mobile",                 "moderator",        "moderators",
"monit",                  "movie",            "movies",
"music",                  "musicas",          "mysql",
"named",                  "names",            "namespace",
"namespaces",             "naoresponda",      "navigation",
"network",                "new-accounts",     "new-business",
"newaccounts",            "newbusiness",      "news-letter",
"news.letter",            "newsbreak",        "newsletter",
"nickname",               "no-replies",       "no-reply",
"no-replys",              "no.replies",       "no.reply",
"no.replys",              "no_reply",         "nobody",
"noemail",                "noreplies",        "noreply",
"noreplys",               "nospam",           "notes",
"nothanks",               "noticias",         "notification",
"notifications",          "notify",           "nytimes",
"oauth",                  "oauth_clients",    "offer",
"offers",                 "office",           "officeadmin",
"official",               "online",           "opened",
"openid",                 "operations",       "operator",
"order",                  "orders",           "organization",
"organizations",          "oriya",            "overview",
"owner",                  "owners",           "package",
"pager",                  "pages",            "panel",
"panjabi",                "partners",         "passwd",
"password",               "passwords",        "patch",
"payment",                "payments",         "personal",
"pharmacy",               "phish",            "phishing",
"photo",                  "photoalbum",       "photos",
"plans",                  "plugin",           "plugins",
"policies",               "policy",           "polish",
"popular",                "portal",           "portuguese",
"post-master",            "post.master",      "postbox",
"postfix",                "postmaster",       "posts",
"premium",                "prepress",         "present",
"president",              "press",            "price",
"pricing",                "prime",            "principal",
"printer",                "privacy",          "privacy-policy",
"privacy_policy",         "privacypolicy",    "private",
"product",                "production",       "products",
"profile",                "profiles",         "project",
"projects",               "promo",            "public",
"purchasing",             "python",           "query",
"questions",              "queue",            "quick",
"quickanswer",            "quickreply",       "quota",
"qwert",                  "qwerty",           "random",
"ranking",                "readme",           "recent",
"reception",              "recover",          "recovery",
"recruit",                "recruiting",       "recruitment",
"refund",                 "refunds",          "refuse",
"refused",                "register",         "registrar",
"registration",           "release",          "releases",
"remember",               "remote",           "remove",
"removed",                "replies",          "reply",
"report",                 "reported",         "reports",
"repositories",           "repository",       "request",
"requests",               "reservations",     "reset",
"reset-password",         "reset_password",   "resetpassword",
"resource",               "resources",        "restore",
"restored",               "result",           "results",
"return",                 "returns",          "revert",
"review",                 "reviewed",         "reviews",
"right",                  "robot",            "robots",
"romanian",               "rules",            "russian",
"sales",                  "salesorder",       "sample",
"samples",                "satisfaction",     "saved",
"scanning",               "school",           "schooloffice",
"script",                 "scripts",          "search",
"searched",               "secret",           "secretary",
"secrets",                "secure",           "security",
"sendmail",               "serbo-croatian",   "serve",
"server",                 "server-info",      "server-status",
"servers",                "service",          "services",
"session",                "sessions",         "setting",
"settings",               "setup",            "share",
"shared",                 "shares",           "sharing",
"shopping",               "sign-in",          "sign-up",
"sign_in",                "sign_up",          "signin",
"signout",                "signup",           "sindhi",
"sitemap",                "sites",            "solution",
"solutions",              "soporte",          "source",
"sources",                "spanish",          "special",
"specs",                  "ssl-admin",        "ssladmin",
"ssladministrator",       "sslwebmaster",     "stacks",
"staff",                  "stage",            "staging",
"starred",                "stars",            "start",
"state",                  "static",           "statistics",
"stats",                  "status",           "statuses",
"storage",                "store",            "stores",
"stories",                "studio",           "style",
"styleguide",             "styles",           "stylesheet",
"stylesheets",            "subdomain",        "subscribe",
"subscribed",             "subscribers",      "subscriptions",
"suggest",                "sunda",            "suporte",
"support",                "support-details",  "supportdetails",
"survey",                 "sys-admin",        "sys.admin",
"sys.administrator",      "sysadmin",         "sysadministrator",
"syslog",                 "system",           "system-administrator",
"system.administrator",   "systems",          "tablet",
"tablets",                "tamil",            "tasks",
"teams",                  "technologies",     "technology",
"telnet",                 "telugu",           "terms",
"terms-of-service",       "terms_of_service", "termsofservice",
"test1",                  "test2",            "test3",
"teste",                  "testing",          "tests",
"theme",                  "themes",           "theoffice",
"thread",                 "threads",          "timeline",
"tld-admin",              "tld-ops",          "tld-tech",
"tld.admin",              "tld.ops",          "tld.tech",
"tldadmin",               "tldops",           "tldtech",
"token",                  "tokens",           "tokenserver",
"tools",                  "topic",            "topics",
"translations",           "trash",            "trending",
"trends",                 "trial",            "trials",
"turkish",                "tutorial",         "twitter",
"ukrainian",              "unavailable",      "undef",
"undisclosed-recipients", "unfollow",         "unread",
"unsubscribe",            "unsupported",      "update",
"updated",                "updates",          "upgrade",
"upload",                 "uploaded",         "uploads",
"uptime",                 "usage",            "use-net",
"use.net",                "usenet",           "username",
"users",                  "usuario",          "vault",
"vendas",                 "vendor",           "version",
"vicepresident",          "video",            "videos",
"vietnamese",             "views",            "visitor",
"wallet",                 "warranty",         "watch",
"weather",                "web-master",       "web-masters",
"web-site",               "web.master",       "web.masters",
"web.site",               "webmail",          "webmaster",
"webmasters",             "website",          "websites",
"wecare",                 "welcome",          "who-is",
"who-is-privacy",         "who.is",           "who.is.privacy",
"whois",                  "whois-privacy",    "whois.privacy",
"whoisprivacy",           "widget",           "widgets",
"windows",                "wishlist",         "wordpress",
"workplace",              "works",            "workshop",
"write",                  "www-data",         "xiang",
"yahoo",                  "yoruba",           "yourdomain",
"yourname",               "yoursite",         "yourusername",
]


const fullList = [...common, ...internal];

export default new Set(fullList);
