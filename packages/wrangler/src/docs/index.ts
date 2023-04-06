import { fetch } from "undici";
import { printWranglerBanner } from "..";
import { readConfig } from "../config";
import { logger } from "../logger";
import * as metrics from "../metrics";
import openInBrowser from "../open-in-browser";
import {
	ALGOLIA_API_KEY,
	ALGOLIA_APPLICATION_ID,
	ALGOLIA_INDEX,
} from "./constants";
import type {
	CommonYargsArgv,
	StrictYargsOptionsToInterface,
} from "../yargs-types";

export function docsOptions(yargs: CommonYargsArgv) {
	return yargs.positional("command", {
		describe: "Enter the wrangler command you want to know more about",
		type: "string",
	});
}

export async function docsHandler(
	args: StrictYargsOptionsToInterface<typeof docsOptions>
) {
	let urlToOpen =
		"https://developers.cloudflare.com/workers/wrangler/commands/";

	if (args.command) {
		const searchResp = await fetch(
			`https://${ALGOLIA_APPLICATION_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`,
			{
				method: "POST",
				body: JSON.stringify({
					params: `query=${args.command}&hitsPerPage=1&getRankingInfo=0`,
				}),
				headers: {
					"X-Algolia-API-Key": ALGOLIA_API_KEY,
					"X-Algolia-Application-Id": ALGOLIA_APPLICATION_ID,
				},
			}
		);
		const searchData = (await searchResp.json()) as { hits: { url: string }[] };
		logger.debug("searchData: ", searchData);
		if (searchData.hits[0]) {
			urlToOpen = searchData.hits[0].url;
		}
	}

	await printWranglerBanner();

	logger.log(`Opening a link in your default browser: ${urlToOpen}`);
	await openInBrowser(urlToOpen);
	const config = readConfig(undefined, args);
	await metrics.sendMetricsEvent("view docs", {
		sendMetrics: config.send_metrics,
	});
}
