import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  photo: string;
  bio: string;
  social: {
    linkedin: string;
  };
}

const TeamMembers = () => {
  const teamMembers: TeamMember[] = [
    {
      name: "SUNIL R",
      role: "Team Member",
      photo: "https://media.licdn.com/dms/image/v2/D4D03AQENdCHHnzQJmg/profile-displayphoto-shrink_400_400/B4DZNm.rwPHQAg-/0/1732599532236?e=1752105600&v=beta&t=zGBm-d7KYjkGUwTV_Vz1SdyZK0R9a0T0hhpOQH0_6a4",
      bio: "Project team member",
      social: {
        linkedin: "https://www.linkedin.com/in/sunil-r-a11b0733a/"
      }
    },
    {
      name: "PRASANTH",
      role: "Team Member",
      photo: "https://media.licdn.com/dms/image/v2/D5603AQF5va2GISFGnw/profile-displayphoto-shrink_400_400/B56ZO7brxkGcAg-/0/1734016418059?e=1752105600&v=beta&t=hIBegL1ndwZarguSEbJh-uJnOhxhFBTjN3S3klQHBwg",
      bio: "Project team member",
      social: {
        linkedin: "https://www.linkedin.com/in/prasanth-m-b4093a33a/"
      }
    },
    {
      name: "PRANAV PRAKASH A",
      role: "Team Member",
      photo: "https://media.licdn.com/dms/image/v2/D4D03AQHvW3XrZWDAkw/profile-displayphoto-shrink_400_400/B4DZabUlhrHwAg-/0/1746362587706?e=1752105600&v=beta&t=NGgE4stJ5MD2KZiCvyakZu5NR2tlK5gB93X5yV3bNm8",
      bio: "Project team member",
      social: {
        linkedin: "https://www.linkedin.com/in/pranav-prakzzz/"
      }
    },
    {
      name: "PRATYUSSH",
      role: "Team Member",
      photo: "https://media.licdn.com/dms/image/v2/D4E03AQEb6oUsFykF9A/profile-displayphoto-shrink_400_400/B4EZabNJbPHYAk-/0/1746360638417?e=1752105600&v=beta&t=Zx2M0RX6WG0GO4cMVs82oRN-iPKEHhOZcTmZcclq3M0",
      bio: "Project team member",
      social: {
        linkedin: "https://www.linkedin.com/in/pratyussh-thirumurugan-a75697330/"
      }
    }
  ];

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-primary/5 py-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Project Team Members
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="mb-3 overflow-hidden rounded-full w-24 h-24 border-2 border-primary/20">
                <img 
                  src={member.photo} 
                  alt={member.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-lg">{member.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{member.role}</p>
              <p className="text-sm mb-3">{member.bio}</p>
              <a 
                href={member.social.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                </svg>
                LinkedIn
              </a>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamMembers;