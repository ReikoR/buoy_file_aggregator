## Setup

Install NodeJS from https://nodejs.org/

## Usage

Run `node aggregator.js <profilesDirectory> <weatherDirectory> <mergedProfilesFileName> <mergedWeatherFileName> <commaSeparatedSubsamplingSteps>`

### Example

`node aggregator.js profiles weather merged_profile.txt merged_weather.txt 1,0.5`

This will result in `merged_profile.txt`, `merged_weather.txt`, `merged_profile_subsampled_1.txt`,
`merged_profile_subsampled_0.5.txt` files being created.